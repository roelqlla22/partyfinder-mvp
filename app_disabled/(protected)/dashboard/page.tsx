"use client"
import { useState } from "react"
type TicketTypeInput = { name: string; priceMXN: number; totalQty: number; perUserLimit?: number }

async function postJSON(url:string, data:any){
  const res = await fetch(url, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(data) })
  const ct = res.headers.get("content-type") || ""
  const text = await res.text()
  if (ct.includes("application/json")) {
    const j = JSON.parse(text)
    if (!res.ok) throw new Error(j.error || res.statusText)
    return j
  } else {
    // HTML u otro => devuelve un resumen para mostrar
    throw new Error(text.slice(0,200))
  }
}

export default function Dashboard(){
  const [tab, setTab] = useState<"create"|"media"|"help">("create")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>("")

  const [eventData, setEventData] = useState<any>({
    title: "", description: "",
    startsAt: "", endsAt: "",
    minAge: 18, dressCode: "",
    tags: "fiesta, música", coverUrl: "",
    organizerId: "ORG_DEMO_ID",
    venueName: "", venueAddress: "", city: "", lat: "", lng: ""
  })
  const [ticket, setTicket] = useState<TicketTypeInput>({ name: "General", priceMXN: 25000, totalQty: 100 })

  function detectLocation(){
    if (!navigator.geolocation) return alert("Geolocalización no disponible.")
    navigator.geolocation.getCurrentPosition(
      pos => setEventData((d:any)=>({ ...d, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) })),
      err => alert("No se pudo obtener ubicación: " + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function createEvent(e:any){
    e.preventDefault(); setLoading(true); setMessage("")
    try {
      let venueId: string|undefined
      if (eventData.venueName || eventData.city || eventData.venueAddress || eventData.lat || eventData.lng) {
        const v = await postJSON("/api/venues", {
          name: eventData.venueName || "Venue",
          address: eventData.venueAddress || "—",
          city: eventData.city || "—",
          lat: eventData.lat ? Number(eventData.lat) : null,
          lng: eventData.lng ? Number(eventData.lng) : null
        })
        venueId = v.id
      }
      const payload = {
        title: eventData.title,
        description: eventData.description,
        startsAt: eventData.startsAt,
        endsAt: eventData.endsAt,
        visibility: "PUBLIC",
        minAge: Number(eventData.minAge) || undefined,
        dressCode: eventData.dressCode || undefined,
        tags: eventData.tags.split(",").map((t:string)=>t.trim()).filter(Boolean),
        organizerId: eventData.organizerId,
        venueId,
        coverUrl: eventData.coverUrl || undefined,
      }
      const ev = await postJSON("/api/events", payload)
      await postJSON("/api/ticket-types", { eventId: ev.id, ...ticket })
      setMessage("✅ Evento creado. Ve a la pestaña Eventos para verlo.")
      setEventData({ ...eventData, title:"", description:"", startsAt:"", endsAt:"", coverUrl:"" })
    } catch (err:any){
      setMessage("❌ Error: " + (err.message || String(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Panel</h1>
        <p className="text-sm text-zinc-600">Crea eventos con ubicación y boleto principal.</p>
      </div>

      <div className="flex gap-2">
        <button onClick={()=>setTab("create")} className={`btn ${tab==="create"?"btn-primary":"btn-outline"}`}>Crear evento</button>
        <a className="btn btn-outline" href="/events">Ver eventos</a>
        <a className="btn btn-outline" href="/scan">Escanear</a>
      </div>

      {tab==="create" && (
        <form onSubmit={createEvent} className="grid md:grid-cols-2 gap-4 card">
          <div className="space-y-3">
            <div><label className="label">Título</label>
              <input className="input" value={eventData.title} onChange={e=>setEventData({...eventData, title:e.target.value})} required />
            </div>
            <div><label className="label">Descripción</label>
              <textarea className="input min-h-[120px]" value={eventData.description} onChange={e=>setEventData({...eventData, description:e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Inicio</label>
                <input type="datetime-local" className="input" value={eventData.startsAt} onChange={e=>setEventData({...eventData, startsAt:e.target.value})} required />
              </div>
              <div><label className="label">Fin</label>
                <input type="datetime-local" className="input" value={eventData.endsAt} onChange={e=>setEventData({...eventData, endsAt:e.target.value})} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Edad mínima</label>
                <input type="number" className="input" value={eventData.minAge} onChange={e=>setEventData({...eventData, minAge:e.target.value})} />
              </div>
              <div><label className="label">Dress code</label>
                <input className="input" value={eventData.dressCode} onChange={e=>setEventData({...eventData, dressCode:e.target.value})} />
              </div>
            </div>

            <div><label className="label">Imagen (URL)</label>
              <input className="input" value={eventData.coverUrl} onChange={e=>setEventData({...eventData, coverUrl:e.target.value})} placeholder="https://..." />
              <p className="helper">URL público (Supabase Storage o similar).</p>
            </div>

            <div><label className="label">Tags</label>
              <input className="input" value={eventData.tags} onChange={e=>setEventData({...eventData, tags:e.target.value})} placeholder="electrónica, rave, ..." />
              <p className="helper">Separadas por coma</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border p-3 bg-white/60">
              <h3 className="font-semibold">Ubicación</h3>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div><label className="label">Nombre del lugar</label>
                  <input className="input" value={eventData.venueName} onChange={e=>setEventData({...eventData, venueName:e.target.value})} />
                </div>
                <div><label className="label">Ciudad</label>
                  <input className="input" value={eventData.city} onChange={e=>setEventData({...eventData, city:e.target.value})} />
                </div>
                <div className="col-span-2"><label className="label">Dirección</label>
                  <input className="input" value={eventData.venueAddress} onChange={e=>setEventData({...eventData, venueAddress:e.target.value})} placeholder="Calle y número" />
                </div>
                <div>
                  <label className="label">Lat</label>
                  <input className="input" value={eventData.lat} onChange={e=>setEventData({...eventData, lat:e.target.value})} />
                </div>
                <div>
                  <label className="label">Lng</label>
                  <input className="input" value={eventData.lng} onChange={e=>setEventData({...eventData, lng:e.target.value})} />
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={detectLocation} className="btn btn-outline">Detectar ubicación</button>
                {(eventData.lat && eventData.lng) && (
                  <a className="btn btn-outline" target="_blank" href={`https://www.google.com/maps/search/?api=1&query=${eventData.lat},${eventData.lng}`}>Ver en Maps</a>
                )}
              </div>
            </div>

            <div className="rounded-2xl border p-3 bg-white/60">
              <h3 className="font-semibold">Boleto principal</h3>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div><label className="label">Nombre</label>
                  <input className="input" value={ticket.name} onChange={e=>setTicket({...ticket, name:e.target.value})} />
                </div>
                <div><label className="label">Precio (centavos MXN)</label>
                  <input type="number" className="input" value={ticket.priceMXN} onChange={e=>setTicket({...ticket, priceMXN:Number(e.target.value)})} />
                </div>
                <div><label className="label">Cantidad total</label>
                  <input type="number" className="input" value={ticket.totalQty} onChange={e=>setTicket({...ticket, totalQty:Number(e.target.value)})} />
                </div>
                <div><label className="label">Límite por usuario</label>
                  <input type="number" className="input" value={ticket.perUserLimit || 0} onChange={e=>setTicket({...ticket, perUserLimit:Number(e.target.value)})} />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn btn-primary" disabled={loading}>{loading ? "Creando…" : "Crear evento"}</button>
              <a className="btn btn-outline" href="/events">Ver eventos</a>
            </div>
            {message && <p className="text-sm">{message}</p>}
          </div>
        </form>
      )}
      {tab==="media" && <div className="card">Usa Supabase Storage (bucket público) y pega el URL.</div>}
      {tab==="help" && <div className="card">Crea el evento y revisa el detalle para comprar (Stripe test).</div>}
    </div>
  )
}
