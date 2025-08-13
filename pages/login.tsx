import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase-browser";

export default function Login(){
  const router = useRouter();
  const [mode, setMode] = useState<"signin"|"signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function send(e: FormEvent){
    e.preventDefault();
    setMsg("");
    try{
      if (mode === "signup"){
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + "/profile" }
        });
        if (error) throw error;
        // Si el proyecto requiere confirmación por correo, no habrá sesión inmediata:
        if (!data.session) {
          setMsg("✅ Revisa tu correo para confirmar la cuenta.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.replace("/profile");
    }catch(err:any){
      setMsg("❌ " + (err.message || String(err)));
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-red-700">{mode==="signin" ? "Entrar" : "Crear cuenta"}</h1>
      <div className="flex gap-2">
        <button className={`px-3 py-2 rounded-lg border ${mode==="signin"?"bg-red-600 text-white border-red-600":"border-zinc-300"}`} onClick={()=>setMode("signin")}>Entrar</button>
        <button className={`px-3 py-2 rounded-lg border ${mode==="signup"?"bg-red-600 text-white border-red-600":"border-zinc-300"}`} onClick={()=>setMode("signup")}>Crear cuenta</button>
      </div>
      <form onSubmit={send} className="space-y-3 bg-white p-4 rounded-2xl border">
        <div>
          <label className="block text-sm font-medium mb-1">Correo</label>
          <input className="w-full rounded-lg border px-3 py-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input className="w-full rounded-lg border px-3 py-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button className="w-full rounded-lg px-3 py-2 bg-red-600 text-white hover:bg-red-700">{mode==="signin"?"Entrar":"Crear cuenta"}</button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
    </div>
  );
}