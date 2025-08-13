import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const { id } = req.query as { id: string };
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("*, venue:venues(*), ticket_types(*)")
    .eq("id", id)
    .single();
  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json(data);
}
