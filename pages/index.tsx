export default function Home(){
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Bienvenido a PartyFinder</h1>
      <p className="text-zinc-400">Explora y crea eventos privados con boletos QR.</p>
      <div className="flex gap-2">
        <a className="btn btn-primary" href="/events">Explorar eventos</a>
        <a className="btn btn-outline" href="/dashboard">Crear evento</a>
      </div>
    </div>
  )
}
