import "./globals.css"
import type { ReactNode } from "react"
import Link from "next/link"

export const metadata = { title: "PartyFinder", description: "Eventos privados con boletos QR" }

const tabs = [
  { href: "/", label: "Inicio" },
  { href: "/events", label: "Eventos" },
  { href: "/scan", label: "Escanear" },
]

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-white to-sky-50 text-zinc-900">
        <header className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-extrabold tracking-tight text-2xl">
              <span className="bg-gradient-to-r from-fuchsia-600 to-sky-600 bg-clip-text text-transparent">PartyFinder</span>
            </Link>
            <nav className="flex items-center gap-1">
              {tabs.map(t => (
                <Link key={t.href} href={t.href} className="px-3 py-2 text-sm rounded-xl hover:bg-zinc-100 transition-colors">
                  {t.label}
                </Link>
              ))}
              <a href="/events" className="ml-2 px-4 py-2 text-sm font-semibold rounded-xl shadow-sm bg-gradient-to-r from-fuchsia-600 to-sky-600 text-white hover:opacity-95 transition">
                Explorar
              </a>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-4">{children}</main>
        <footer className="max-w-6xl mx-auto px-4 py-12 text-xs text-zinc-500">
          � {new Date().getFullYear()} PartyFinder � MVP
        </footer>
      </body>
    </html>
  )
}
