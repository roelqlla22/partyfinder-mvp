function mapsLink(venue:any){
  if (!venue) return null
  if (venue.lat && venue.lng) return `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`
  const q = encodeURIComponent(`${venue.address||""} ${venue.city||""}`.trim())
  return q ? `https://www.google.com/maps/search/?api=1&query=${q}` : null
}

import { prisma } from "@/lib/db"

export default async function EventsPage(){
  const events = await prisma.event.findMany({
    include: { venue: true },
    orderBy: { startsAt: "asc" }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Eventos</h1>
          <p className="text-sm text-zinc-600">Encuentra tu próxima fiesta.</p>
        </div>
        <a className="btn btn-primary" href="/dashboard">+ Crear evento</a>
      </div>

      {events.length === 0 && (
        <div className="card">
          <p className="text-zinc-600">No hay eventos aún. <a href="/dashboard" className="text-fuchsia-600 font-semibold">Crea el primero</a>.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e:any)=> {
          const link = mapsLink(e.venue)
          return (
            <div key={e.id} className="card hover:shadow-lg transition">
              <a href={`/events/${e.id}`}>
                <img src={e.coverUrl || "/placeholder.jpg"} className="w-full h-44 object-cover rounded-xl" alt={e.title}/>
                <h3 className="mt-3 text-lg font-semibold">{e.title}</h3>
                <p className="text-sm opacity-70 line-clamp-2">{e.description}</p>
              </a>
              <div className="mt-2 text-sm">{new Date(e.startsAt).toLocaleString()}</div>
              <div className="mt-1 text-xs opacity-60">
                {[e.venue?.name, e.venue?.city].filter(Boolean).join(" • ")}
              </div>
              {link && <a className="mt-2 inline-block text-sm text-fuchsia-700 hover:underline" target="_blank" href={link}>Cómo llegar</a>}
              <div className="mt-3 flex flex-wrap gap-1">
                {(e.tags || []).map((t:string)=> <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-fuchsia-50 text-fuchsia-700">{t}</span>)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
