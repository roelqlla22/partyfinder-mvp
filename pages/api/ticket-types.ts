import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { eventId, name, priceMXN, totalQty, perUserLimit } = req.body;
    const { data, error } = await supabaseAdmin.from("ticket_types").insert({
      event_id: eventId,
      name,
      price_mxn: priceMXN,
      total_qty: totalQty,
      per_user_limit: perUserLimit ?? null,
    }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  }
  return res.status(405).end();
}
