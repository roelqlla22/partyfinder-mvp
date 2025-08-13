import { z } from 'zod'
export const EventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  startsAt: z.string(),
  endsAt: z.string(),
  visibility: z.enum(['PUBLIC','PRIVATE','UNLISTED']).default('PUBLIC'),
  minAge: z.number().int().optional(),
  dressCode: z.string().optional(),
  tags: z.array(z.string()).default([]),
  organizerId: z.string(),
  venueId: z.string().optional(),
  coverUrl: z.string().url().optional()
})
