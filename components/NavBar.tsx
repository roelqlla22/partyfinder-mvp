import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase-browser";

export default function NavBar(){
  const [email, setEmail] = useState<string|null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({data}) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setEmail(s?.user?.email ?? null);
    });
    return () => { sub?.subscription.unsubscribe(); };
  }, []);

  async function logout(){
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const Link = (p:any) => <a className="px-3 py-2 hover:underline" {...p}/>;

  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-3">
        <div className="flex items-center gap-1">
          <a className="font-bold text-red-600 px-2" href="/">PartyFinder</a>
          <nav className="hidden md:flex">
            <Link href="/events">Eventos</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/my-tickets">Mis boletos</Link>
            <Link href="/ayuda">Ayuda</Link>
            <Link href="/contacto">Contacto</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {email ? (
            <>
              <a className="px-3 py-2 text-sm text-zinc-700 hover:underline" href="/profile">{email}</a>
              <button onClick={logout} className="rounded-lg px-3 py-2 border border-zinc-300 hover:bg-zinc-50">Salir</button>
            </>
          ) : (
            <a className="rounded-lg px-3 py-2 bg-red-600 text-white hover:bg-red-700" href="/login">Entrar</a>
          )}
        </div>
      </div>
    </header>
  );
}