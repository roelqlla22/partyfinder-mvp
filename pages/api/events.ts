import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // join autom�tico v�a FK: events.venue_id -> venues.id
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*, venue:venues(*), ticket_types(*)")
      .order("starts_at", { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  if (req.method === "POST") {
    const {
      title, description, startsAt, endsAt, visibility, minAge, dressCode, tags,
      organizerId, venueId, coverUrl
    } = req.body;

    const { data, error } = await supabaseAdmin.from("events")
      .insert({
        title, description,
        starts_at: startsAt, ends_at: endsAt,
        visibility: visibility || "PUBLIC",
        min_age: minAge ?? null,
        dress_code: dressCode ?? null,
        tags: Array.isArray(tags) ? tags : [],
        organizer_id: organizerId,
        venue_id: venueId ?? null,
        cover_url: coverUrl ?? null,
      })
      .select().single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).end();
}

