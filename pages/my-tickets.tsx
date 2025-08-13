import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase-browser";

type TicketRow = {
  id: string;
  created_at: string | null;
  qr_secret: string | null;
  status: string | null;
};

export default function MyTickets() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null); // id interno (public.users)
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [qr, setQr] = useState<Record<string, string>>({});   // ticketId -> dataURL
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      // 1) Debe estar logueado
      const { data: auth } = await supabase.auth.getUser();
      const u = auth.user;
      if (!u) {
        window.location.href = "/login";
        return;
      }
      setEmail(u.email ?? null);

      // 2) Mapear email -> id interno
      const { data: row, error: uErr } = await supabase
        .from("users")
        .select("id")
        .eq("email", u.email)
        .maybeSingle();

      if (uErr) {
        setError(uErr.message);
        setLoading(false);
        return;
      }
      if (!row) {
        setError("No encontré tu usuario interno. Realiza una compra o guarda tu perfil primero.");
        setLoading(false);
        return;
      }

      setUserId(row.id);

      // 3) Leer tickets por id interno
      const { data: tks, error: tErr } = await supabase
        .from("tickets")
        .select("id, created_at, qr_secret, status")
        .eq("user_id", row.id)
        .order("created_at", { ascending: false });

      if (tErr) setError(tErr.message);
      setTickets(tks || []);
      setLoading(false);
    })();
  }, []);

  async function generateQR(t: TicketRow) {
    if (qr[t.id]) return; // ya generado
    const QRCode = (await import("qrcode")).default;
    const payload = `PF|${t.id}|${t.qr_secret ?? ""}`;
    const dataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 260 });
    setQr((q) => ({ ...q, [t.id]: dataUrl }));
  }

  if (loading) return <div className="card">Cargando tus boletos…</div>;
  if (error) return <div className="card">❌ Error: {error}</div>;

  if (!tickets.length) {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold">Mis boletos</h1>
        <p className="text-sm text-zinc-600">
          Aún no tienes boletos asociados a <b>{email}</b>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-semibold">Mis boletos</h1>
        <div className="text-sm text-zinc-600">
          Cuenta: <b>{email}</b>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tickets.map((t) => (
          <div key={t.id} className="card">
            <div className="text-sm"><b>ID</b>: {t.id}</div>
            <div className="text-sm"><b>Estado</b>: {t.status ?? "—"}</div>
            <div className="text-xs text-zinc-500">
              {t.created_at ? new Date(t.created_at).toLocaleString() : ""}
            </div>

            {qr[t.id] ? (
              <>
                <img src={qr[t.id]} className="mt-2 mx-auto" alt={t.id} />
                <a
                  className="btn btn-outline mt-2"
                  download={`boleto-${t.id}.png`}
                  href={qr[t.id]}
                >
                  Descargar
                </a>
              </>
            ) : (
              <button
                className="btn btn-outline mt-2"
                onClick={() => generateQR(t)}
              >
                Ver QR
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}