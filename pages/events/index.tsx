function mapsLink(venue:any){
  if (!venue) return null
  if (venue.lat && venue.lng) return `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`
  const q = encodeURIComponent(`${venue.address||""} ${venue.city||""}`.trim())
  return q ? `https://www.google.com/maps/search/?api=1&query=${q}` : null
}

export async function getServerSideProps(){
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let events:any[] = [];
  try {
    const res = await fetch(`${base}/api/events`);
    events = await res.json();
  } catch {}
  return { props: { events } };
}

export default function EventsPage({ events }: { events: any[] }){
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Eventos</h1>
          <p className="text-sm text-zinc-400">Encuentra tu prÃ³xima fiesta.</p>
        </div>
        <a className="btn btn-primary" href="/dashboard">+ Crear evento</a>
      </div>

      {(!events || events.length === 0) && (
        <div className="card">
          <p className="text-zinc-400">No hay eventos aÃºn. <a href="/dashboard" className="text-fuchsia-400 font-semibold">Crea el primero</a>.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(events || []).map((e:any)=> {
          const link = mapsLink(e.venue)
          return (
            <div key={e.id} className="card hover:shadow-lg transition">
              <a href={`/events/${e.id}`}>
                <img src={e.cover_url || "/placeholder.jpg"} className="w-full h-44 object-cover rounded-xl" alt={e.title}/>
                <h3 className="mt-3 text-lg font-semibold">{e.title}</h3>
                <p className="text-sm opacity-70 line-clamp-2">{e.description}</p>
              </a>
              <div className="mt-2 text-sm">{new Date(e.starts_at).toLocaleString()}</div>
              <div className="mt-1 text-xs opacity-60">
                {[e.venue?.name, e.venue?.city].filter(Boolean).join(" â€¢ ")}
              </div>
              {link && <a className="mt-2 inline-block text-sm text-fuchsia-400 hover:underline" target="_blank" href={link}>CÃ³mo llegar</a>}
              <div className="mt-3 flex flex-wrap gap-1">
                {(e.tags || []).map((t:string)=> <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-fuchsia-900/40 text-fuchsia-200">{t}</span>)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

