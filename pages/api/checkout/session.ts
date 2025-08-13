import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { supabaseAdmin } from "../../../lib/supabase-admin";

const stripeKey = process.env.STRIPE_SECRET_KEY!;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") { res.status(405).end(); return; }
    if (!stripeKey) { res.status(400).json({ error: "Falta STRIPE_SECRET_KEY" }); return; }
    const stripe = new Stripe(stripeKey);

    const body: any = req.body || {};
    const userEmail: string = body.userEmail || body.userId || "buyer@partyfinder.local";
    const items = typeof body.items === "string" ? JSON.parse(body.items) : (body.items || []);
    if (!Array.isArray(items) || items.length === 0) { res.status(400).json({ error: "Sin items" }); return; }

    // 1) Asegurar usuario interno (public.users)
    const { data: userRow, error: uerr } = await supabaseAdmin
      .from("users")
      .upsert({ email: userEmail }, { onConflict: "email" })
      .select("id")
      .maybeSingle();
    if (uerr) { res.status(400).json({ error: uerr.message }); return; }
    const userId = userRow?.id;

    // 2) Cargar ticket_types
    const ids = items.map((i: any) => i.ticketTypeId);
    const { data: tts, error: terr } = await supabaseAdmin
      .from("ticket_types")
      .select("id,name,price_mxn,per_user_limit,total_qty")
      .in("id", ids);
    if (terr) { res.status(400).json({ error: terr.message }); return; }

    // 3) Validar límites por usuario y stock (si existen columnas)
    for (const it of items) {
      const tt = tts?.find(t => t.id === it.ticketTypeId);
      if (!tt) { res.status(400).json({ error: "Tipo de boleto inválido" }); return; }
      const qty = Number(it.qty || 0);
      if (qty <= 0) { res.status(400).json({ error: "Cantidad inválida" }); return; }

      // Límite por usuario
      if (tt.per_user_limit && userId) {
        // cuantos ya tiene el usuario para este tipo
        const { data: oiRows } = await supabaseAdmin
          .from("order_items")
          .select("id")
          .eq("ticket_type_id", tt.id);
        const oiIds = (oiRows || []).map((r: any) => r.id);
        let already = 0;
        if (oiIds.length) {
          const { count } = await supabaseAdmin
            .from("tickets")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .in("order_item_id", oiIds);
          already = count || 0;
        }
        if (already + qty > tt.per_user_limit) {
          res.status(400).json({ error: `Límite por persona para "${tt.name}" (${tt.per_user_limit}). Ya tienes ${already}.` });
          return;
        }
      }

      // Stock total (si existe total_qty)
      if (tt.total_qty) {
        const { data: oiRowsAll } = await supabaseAdmin
          .from("order_items")
          .select("id")
          .eq("ticket_type_id", tt.id);
        const oiIdsAll = (oiRowsAll || []).map((r: any) => r.id);
        let sold = 0;
        if (oiIdsAll.length) {
          const { count } = await supabaseAdmin
            .from("tickets")
            .select("id", { count: "exact", head: true })
            .in("order_item_id", oiIdsAll);
          sold = count || 0;
        }
        const remaining = tt.total_qty - sold;
        if (qty > remaining) {
          res.status(400).json({ error: `Stock insuficiente para "${tt.name}". Quedan ${remaining}.` });
          return;
        }
      }
    }

    // 4) Crear line_items para Stripe (centavos)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    for (const it of items) {
      const tt = tts?.find(t => t.id === it.ticketTypeId);
      if (!tt) continue;
      const qty = Number(it.qty || 1);
      const unit_amount = Math.round(Number(tt.price_mxn) * 100);
      lineItems.push({
        quantity: qty,
        price_data: {
          currency: "mxn",
          product_data: { name: tt.name },
          unit_amount
        },
      });
    }
    if (lineItems.length === 0) { res.status(400).json({ error: "Items inválidos" }); return; }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/events`,
      metadata: { userEmail, items: JSON.stringify(items) },
    });

    res.redirect(303, session.url as string);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || String(err) });
  }
}