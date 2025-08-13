import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const email = (req.query.email as string) || "admin@partyfinder.local";

    // 1) upsert user (rol ORGANIZER)
    const { data: user, error: e1 } = await supabaseAdmin
      .from("users")
      .upsert({ email, name: "Admin", role: "ORGANIZER" }, { onConflict: "email" })
      .select()
      .single();
    if (e1) return res.status(400).json({ error: e1.message });

    // 2) upsert organizer para ese user
    const { data: org, error: e2 } = await supabaseAdmin
      .from("organizers")
      .upsert({ user_id: user.id, display_name: "Organizador Admin", verified: true }, { onConflict: "user_id" })
      .select()
      .single();
    if (e2) return res.status(400).json({ error: e2.message });

    return res.status(200).json({ organizerId: org.id, email });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
