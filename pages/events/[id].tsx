import { useEffect, useMemo, useRef, useState } from "react";
import type { GetServerSideProps } from "next";
import { supabase } from "../../lib/supabase-browser";

type TicketType = {
  id: string;
  name: string;
  price_mxn: number;
  per_user_limit?: number | null;
  total_qty?: number | null;
  // opcionales por si tu API los devuelve:
  available?: number | null;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const id = ctx.params?.id as string;
  const base =
    process.env.NEXT_PUBLIC_APP_URL || `http://${ctx.req.headers.host}`;
  const r = await fetch(`${base}/api/events/${id}`);
  if (!r.ok) return { notFound: true };
  const data = await r.json();
  return { props: { event: data } };
};

export default function EventDetail({ event }: { event: any }) {
  const ticketTypes: TicketType[] =
    event?.ticketTypes || event?.ticket_types || [];
  const [email, setEmail] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const itemsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  // inicializa cantidades en 0
  useEffect(() => {
    const base: Record<string, number> = {};
    for (const t of ticketTypes) base[t.id] = 0;
    setQty((q) => ({ ...base, ...q }));
  }, [ticketTypes]);

  function inc(id: string, max?: number | null) {
    setQty((q) => {
      const next = (q[id] || 0) + 1;
      if (max && next > max) return q;
      return { ...q, [id]: next };
    });
  }
  function dec(id: string) {
    setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] || 0) - 1) }));
  }

  const items = useMemo(
    () =>
      Object.entries(qty)
        .map(([ticketTypeId, n]) => ({ ticketTypeId, qty: Number(n) || 0 }))
        .filter((i) => i.qty > 0),
    [qty]
  );

  const total = useMemo(() => {
    let sum = 0;
    for (const i of items) {
      const tt = ticketTypes.find((t) => t.id === i.ticketTypeId);
      if (tt) sum += Number(tt.price_mxn) * i.qty;
    }
    return sum;
  }, [items, ticketTypes]);

  // Validación simple en cliente (el servidor volverá a validar)
  const clientError = useMemo(() => {
    for (const i of items) {
      const tt = ticketTypes.find((t) => t.id === i.ticketTypeId);
      if (!tt) continue;
      if (tt.per_user_limit && i.qty > tt.per_user_limit) {
        return `Límite por persona (${tt.per_user_limit}) para "${tt.name}"`;
      }
    }
    return null;
  }, [items, ticketTypes]);

  function pay() {
    if (!email) {
      alert("Inicia sesión para comprar.");
      window.location.href = "/login";
      return;
    }
    if (items.length === 0) {
      alert("Selecciona al menos 1 boleto.");
      return;
    }
    if (clientError) {
      alert(clientError);
      return;
    }
    // Cargar los items en el input oculto y enviar el form
    if (itemsInputRef.current && formRef.current) {
      itemsInputRef.current.value = JSON.stringify(items);
      formRef.current.submit();
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold">{event?.title || "Evento"}</h1>
        {event?.startsAt && (
          <div className="text-sm text-zinc-600">
            {new Date(event.startsAt).toLocaleString()}
          </div>
        )}
      </div>

      <div className="card space-y-3">
        <h2 className="text-lg font-semibold">Boletos</h2>

        <ul className="space-y-2">
          {ticketTypes.map((tt) => {
            const n = qty[tt.id] || 0;
            return (
              <li
                key={tt.id}
                className="flex items-center justify-between gap-3 border rounded-xl p-3"
              >
                <div className="min-w-0">
                  <div className="font-medium">{tt.name}</div>
                  <div className="text-sm text-zinc-600">
                    ${Number(tt.price_mxn || 0).toFixed(2)} MXN
                    {typeof tt.per_user_limit === "number" &&
                      tt.per_user_limit > 0 && (
                        <> · Límite por persona: {tt.per_user_limit}</>
                      )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => dec(tt.id)}
                    className="px-3 py-1 rounded-lg border hover:bg-zinc-50"
                  >
                    –
                  </button>
                  <div className="w-10 text-center">{n}</div>
                  <button
                    type="button"
                    onClick={() => inc(tt.id, tt.per_user_limit ?? null)}
                    className="px-3 py-1 rounded-lg border hover:bg-zinc-50"
                  >
                    +
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-zinc-600">
            {email ? <>Comprará como <b>{email}</b></> : "No has iniciado sesión"}
          </div>
          <div className="text-lg font-semibold">
            Total: ${total.toFixed(2)} MXN
          </div>
        </div>

        {clientError && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {clientError}
          </div>
        )}

        <div className="pt-1">
          <form
            ref={formRef}
            action="/api/checkout/session"
            method="POST"
            className="hidden"
          >
            <input type="hidden" name="userEmail" value={email || ""} />
            <input ref={itemsInputRef} type="hidden" name="items" />
          </form>

          <button
            type="button"
            onClick={pay}
            className="btn btn-primary"
            disabled={items.length === 0}
          >
            Pagar
          </button>
        </div>
      </div>
    </div>
  );
}