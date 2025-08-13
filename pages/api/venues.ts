import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { name, address, city, lat, lng } = req.body;
    const { data, error } = await supabaseAdmin.from("venues").insert({
      name, address: address || null, city: city || null,
      lat: lat ?? null, lng: lng ?? null,
    }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  }
  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin.from("venues").select("*").order("name");
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }
  return res.status(405).end();
}

