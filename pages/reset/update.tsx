import { useState } from "react";
import { supabase } from "../../lib/supabase-browser";

export default function UpdatePassword(){
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");

  async function save(){
    setMsg("");
    const { error } = await supabase.auth.updateUser({ password: pass });
    setMsg(error ? "❌ " + error.message : "✅ Contraseña actualizada");
    if (!error) window.location.href = "/profile";
  }

  return (
    <div className="max-w-md mx-auto space-y-3 bg-white p-4 rounded-2xl border">
      <h1 className="text-xl font-semibold text-red-700">Nueva contraseña</h1>
      <input className="w-full rounded-lg border px-3 py-2" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" />
      <button onClick={save} className="w-full rounded-lg px-3 py-2 bg-red-600 text-white hover:bg-red-700">Guardar</button>
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}