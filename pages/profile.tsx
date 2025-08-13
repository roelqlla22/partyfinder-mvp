import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase-browser";

type TicketBrief = { id:string, created_at:string };

export default function Profile(){
  const [userId,setUserId]=useState<string|null>(null);
  const [email,setEmail]=useState<string|null>(null);
  const [name,setName]=useState(""); const [phone,setPhone]=useState(""); const [bio,setBio]=useState("");
  const [avatarUrl,setAvatarUrl]=useState<string|null>(null);
  const [edit,setEdit]=useState(false);
  const [saving,setSaving]=useState(false);
  const [tickets,setTickets]=useState<TicketBrief[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user; if(!u){ window.location.href="/login"; return; }
      setUserId(u.id); setEmail(u.email ?? null);
      const { data: p } = await supabase.from("user_profiles").select("*").eq("id", u.id).maybeSingle();
      if (p){ setName(p.name||""); setPhone(p.phone||""); setBio(p.bio||""); setAvatarUrl(p.avatar_url||null); }
      // tickets recientes del usuario
      const { data: tks } = await supabase.from("tickets").select("id, created_at").eq("user_id", u.id).order("created_at", { ascending:false }).limit(10);
      setTickets(tks || []);
    });
  }, []);

  async function onAvatarChange(e:any){
    if(!userId) return;
    const f:File|undefined=e.target.files?.[0]; if(!f) return;
    const ext=f.name.split(".").pop(); const path=`public/${userId}-${Date.now()}.${ext}`;
    const up=await supabase.storage.from("avatars").upload(path,f,{upsert:true});
    if(up.error){ alert(up.error.message); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(pub.publicUrl);
  }

  async function save(){
    if(!userId) return;
    setSaving(true);
    const { error } = await supabase.from("user_profiles").upsert({
      id:userId, name:name||null, phone:phone||null, bio:bio||null, avatar_url:avatarUrl||null
    });
    setSaving(false);
    if(error) alert(error.message); else setEdit(false);
  }

  if(!email) return null;

  return (
    <div className="max-w-3xl mx-auto bg-white border rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-4">
        <img src={avatarUrl||"/avatar-placeholder.svg"} className="w-20 h-20 rounded-full object-cover border" />
        <div className="flex-1">
          <div className="text-sm text-zinc-500">{email}</div>
          {!edit && <h1 className="text-2xl font-bold">{name || "Tu perfil"}</h1>}
          {!edit && <button onClick={()=>setEdit(true)} className="mt-2 inline-flex items-center rounded-lg px-3 py-2 border border-zinc-300 hover:bg-zinc-50">Editar</button>}
        </div>
      </div>

      {edit && (
        <div className="space-y-3">
          <div><input type="file" accept="image/*" onChange={onAvatarChange} /></div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Nombre</label>
              <input className="w-full rounded-lg border px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Teléfono</label>
              <input className="w-full rounded-lg border px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Bio</label>
            <textarea className="w-full rounded-lg border px-3 py-2" value={bio} onChange={e=>setBio(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button disabled={saving} onClick={save} className="inline-flex items-center rounded-lg px-4 py-2 text-white bg-red-600 hover:bg-red-700">{saving?"Guardando…":"Guardar"}</button>
            <button onClick={()=>setEdit(false)} className="inline-flex items-center rounded-lg px-4 py-2 border border-zinc-300 hover:bg-zinc-50">Cancelar</button>
          </div>
        </div>
      )}

      {!edit && (
        <div className="space-y-2">
          <div><b>Nombre:</b> {name || "—"}</div>
          <div><b>Teléfono:</b> {phone || "—"}</div>
          <div><b>Bio:</b> {bio || "—"}</div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-2">Tus últimos boletos</h2>
        {tickets.length===0 ? (
          <div className="text-sm text-zinc-500">Aún no tienes boletos.</div>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-3">
            {tickets.map(t=>(
              <li key={t.id} className="card">
                <div className="text-sm">ID: {t.id}</div>
                <div className="text-xs text-zinc-500">Fecha: {new Date(t.created_at).toLocaleString()}</div>
                <a className="btn btn-outline mt-2" href="/my-tickets">Ver todos</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}