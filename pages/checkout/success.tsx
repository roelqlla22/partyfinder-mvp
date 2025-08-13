import type { GetServerSideProps } from "next";
import Stripe from "stripe";
import { supabaseAdmin } from "../../lib/supabase-admin";

type QR = { id: string; dataUrl: string };

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session_id = (ctx.query.session_id as string) || "";
  if (!session_id) return { redirect: { destination: "/events", permanent: false } };

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  const session = await stripe.checkout.sessions.retrieve(session_id);
  const meta: any = session.metadata || {};
  const buyerEmail = String(meta.userEmail || "").toLowerCase();
  if (!buyerEmail) return { props: { error: "No llegó el email del comprador." } };

  // 1) Usuario (tabla users) por email
  const { data: user, error: uerr } = await supabaseAdmin
    .from("users")
    .upsert({ email: buyerEmail }, { onConflict: "email" })
    .select("id,email")
    .single();
  if (uerr || !user) return { props: { error: uerr?.message || "No se pudo crear/leer usuario" } };

  // ¿Orden ya creada para este Stripe session?
  const { data: existing } = await supabaseAdmin
    .from("orders")
    .select("id,confirmation_code,created_at")
    .eq("stripe_id", session_id)
    .maybeSingle();

  let orderId: string;
  let confirmation = existing?.confirmation_code || "";
  let when = existing?.created_at || null;

  if (!existing) {
    // 2) Reconstruir items y precios
    let items: any[] = [];
    try { items = JSON.parse(meta.items || "[]"); } catch {}
    if (items.length === 0) return { props: { error: "No hay items en metadata" } };
    const ids = items.map((i: any) => i.ticketTypeId);
    const { data: types, error: terr } = await supabaseAdmin
      .from("ticket_types").select("id,price_mxn").in("id", ids);
    if (terr) return { props: { error: terr.message } };

    const total = items.reduce((acc, it) => {
      const tt = types?.find(t => t.id === it.ticketTypeId);
      return acc + (tt ? Number(tt.price_mxn) * Number(it.qty || 1) : 0);
    }, 0);

    const { randomBytes } = await import("crypto");
    confirmation = "PF-" + randomBytes(4).toString("hex").toUpperCase();

    // 3) Crear order (con user_id válido)
    const { data: order, error: oerr } = await supabaseAdmin
      .from("orders")
      .insert({ user_id: user.id, amount_mxn: total, status: "PAID", stripe_id: session_id, confirmation_code: confirmation })
      .select("id,created_at")
      .single();
    if (oerr || !order) return { props: { error: oerr?.message || "No se pudo crear la orden" } };

    orderId = order.id;
    when = order.created_at;

    // 4) items + tickets
    for (const it of items) {
      const tt = types?.find(t => t.id === it.ticketTypeId);
      if (!tt) continue;
      const qty = Number(it.qty || 1);

      const { data: oi, error: oierr } = await supabaseAdmin
        .from("order_items")
        .insert({ order_id: orderId, ticket_type_id: it.ticketTypeId, quantity: qty, unit_price_mxn: tt.price_mxn })
        .select("id")
        .single();
      if (oierr || !oi) return { props: { error: oierr?.message || "No se pudo crear order_item" } };

      const rows = Array.from({ length: qty }).map(() => ({
        order_item_id: oi.id,
        user_id: user.id,
        status: "PAID",
        qr_secret: randomBytes(16).toString("hex"),
      }));
      const { error: tkerr } = await supabaseAdmin.from("tickets").insert(rows);
      if (tkerr) return { props: { error: tkerr.message } };
    }
  } else {
    orderId = existing.id;
  }

  // 5) Leer tickets de la orden y generar QRs
  const { data: oi } = await supabaseAdmin.from("order_items").select("id").eq("order_id", orderId);
  const ids = (oi || []).map(r => r.id);
  const { data: tks, error: rerr } = await supabaseAdmin
    .from("tickets")
    .select("id,qr_secret,created_at")
    .in("order_item_id", ids)
    .order("created_at", { ascending: false });
  if (rerr) return { props: { error: rerr.message } };

  const QRCode = (await import("qrcode")).default;
  const qrs: QR[] = [];
  for (const t of (tks || [])) {
    const payload = `PF|${t.id}|${t.qr_secret}`;
    const dataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 260 });
    qrs.push({ id: t.id, dataUrl });
  }

  return { props: { qrs, confirmation, when } };
};

export default function Success({ qrs, error, confirmation, when }:{
  qrs?: QR[], error?: string, confirmation?: string, when?: string
}) {
  if (error) return <div className="card">❌ Error: {error}</div>;
  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-2xl font-bold text-red-700">¡Pago confirmado!</h1>
        <div className="mt-2 text-sm">
          {confirmation && <div><b>Confirmación:</b> {confirmation}</div>}
          {when && <div><b>Fecha de compra:</b> {new Date(when).toLocaleString()}</div>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(qrs||[]).map(q => (
          <div key={q.id} className="card text-center">
            <img src={q.dataUrl} alt={q.id} className="mx-auto" />
            <div className="mt-2 text-xs text-zinc-500">Ticket: {q.id}</div>
            <a className="btn btn-outline mt-2" download={`boleto-${q.id}.png`} href={q.dataUrl}>Descargar</a>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <a className="btn btn-primary" href="/my-tickets">Mis boletos</a>
        <a className="btn btn-outline" href="/events">Seguir explorando</a>
      </div>
    </div>
  );
}