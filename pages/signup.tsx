import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabase-browser";

export default function SignUp(){
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e: FormEvent){
    e.preventDefault();
    setMsg("");
    if (pass !== pass2) { setMsg("❌ Las contraseñas no coinciden"); return; }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        emailRedirectTo: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + "/profile",
        data: { full_name: fullName }
      }
    });
    if (error) { setMsg("❌ " + error.message); return; }

    try {
      // Si hay sesión, crea/actualiza perfil; si no, el TRIGGER del backend lo hará al confirmar email
      const uid = data.user?.id;
      if (uid) {
        await supabase.from("profiles").upsert({ id: uid, full_name: fullName });
      }
    } catch {}

    setMsg("✅ Revisa tu correo para confirmar tu cuenta.");
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-red-700">Crear cuenta</h1>
      <form onSubmit={submit} className="space-y-3 bg-white p-4 rounded-2xl border">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre completo</label>
          <input className="w-full rounded-lg border px-3 py-2" value={fullName} onChange={e=>setFullName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Correo</label>
          <input className="w-full rounded-lg border px-3 py-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input className="w-full rounded-lg border px-3 py-2" type="password" value={pass} onChange={e=>setPass(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirmar</label>
            <input className="w-full rounded-lg border px-3 py-2" type="password" value={pass2} onChange={e=>setPass2(e.target.value)} required />
          </div>
        </div>
        <button className="w-full rounded-lg px-3 py-2 bg-red-600 text-white hover:bg-red-700">Crear cuenta</button>
        {msg && <p className="text-sm">{msg}</p>}
        <p className="text-xs text-zinc-500">¿Ya tienes cuenta? <a className="text-red-600 underline" href="/login">Inicia sesión</a></p>
      </form>
    </div>
  );
}