function mapsLink(venue:any){
  if (!venue) return null
  if (venue.lat && venue.lng) return `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`
  const q = encodeURIComponent(`${venue.address||""} ${venue.city||""}`.trim())
  return q ? `https://www.google.com/maps/search/?api=1&query=${q}` : null
}

async function getEvent(id:string){
  const base = process.env.NEXT_PUBLIC_APP_URL || ""
  const res = await fetch(`${base}/api/events/${id}`, { cache: "no-store" })
  return await res.json()
}

export default async function EventDetail({ params }: { params: { id: string } }){
  const e = await getEvent(params.id)
  if (!e || e.error) return <div className="card">Evento no encontrado</div>
  const link = mapsLink(e.venue)
  return (
    <div className="max-w-3xl space-y-3">
      <img src={e.cover_url || "/placeholder.jpg"} className="w-full h-64 object-cover rounded-2xl" alt={e.title}/>
      <h1 className="text-2xl font-bold">{e.title}</h1>
      <p className="opacity-80">{e.description}</p>
      <div className="text-sm">{new Date(e.starts_at).toLocaleString()} — {new Date(e.ends_at).toLocaleString()}</div>
      <div className="text-xs opacity-60">{[e.venue?.name, e.venue?.address, e.venue?.city].filter(Boolean).join(" • ")}</div>
      {link && <a className="inline-block text-sm text-fuchsia-400 hover:underline" target="_blank" href={link}>Cómo llegar</a>}

      <div className="mt-6 grid gap-3">
        {(e.ticket_types || []).map((tt:any) => (
          <form method="POST" action="/api/checkout/session" key={tt.id} className="card">
            <input type="hidden" name="userId" value="demo-user" />
            <input type="hidden" name="items" value={JSON.stringify([{ ticketTypeId: tt.id, qty: 1 }])} />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{tt.name}</div>
                <div className="text-sm text-zinc-400">${(tt.price_mxn/100).toFixed(2)} MXN</div>
              </div>
              <button className="btn btn-primary">Comprar</button>
            </div>
          </form>
        ))}
      </div>
    </div>
  )
}
