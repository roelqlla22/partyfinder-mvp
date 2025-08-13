import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { qrSecret, guardUserId } = req.body as { qrSecret: string, guardUserId: string }

  const ticket = await prisma.ticket.findUnique({ where: { qrSecret } })
  if (!ticket) return res.status(404).json({ ok: false, reason: 'NOT_FOUND' })
  if (ticket.status !== 'PAID') return res.status(400).json({ ok: false, reason: ticket.status })

  await prisma.ticket.update({ where: { id: ticket.id }, data: { status: 'CHECKED_IN', checkedInAt: new Date() } })
  return res.status(200).json({ ok: true })
}
