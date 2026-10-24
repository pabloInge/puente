import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bond } from '@/lib/db/schema'
import { generateWeeklySummary } from '@/lib/services/summaries'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  // Calculate the Monday of the current/previous week
  const now = new Date()
  const day = now.getUTCDay()
  const diffToMonday = (day + 6) % 7 // Monday = 0
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - diffToMonday)
  const weekStart = monday.toISOString().slice(0, 10)

  // Find all active bonds
  const activeBonds = await db
    .select({ id: bond.id })
    .from(bond)
    .where(eq(bond.status, 'active'))

  let generatedCount = 0
  for (const b of activeBonds) {
    try {
      await generateWeeklySummary(b.id, weekStart)
      generatedCount++
    } catch (err) {
      console.error(`Failed to generate summary for bond ${b.id}:`, err)
    }
  }

  return NextResponse.json({
    ok: true,
    weekStart,
    totalBonds: activeBonds.length,
    generatedCount,
  })
}
