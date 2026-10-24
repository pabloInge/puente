import { NextResponse } from 'next/server'
import { and, eq, lte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { appointment, patientProfile, professionalProfile } from '@/lib/db/schema'
import { notifier } from '@/lib/notifier'

export async function GET(req: Request) {
  // Check CRON_SECRET if configured
  const authHeader = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  const now = new Date()

  // 1. Expire unconfirmed requested appointments past their expiresAt
  const expiredAppointments = await db
    .update(appointment)
    .set({
      status: 'rejected',
      cancelReason: 'Vencimiento automático por falta de confirmación',
      updatedAt: now,
    })
    .where(
      and(
        eq(appointment.status, 'requested'),
        lte(appointment.expiresAt, now),
      ),
    )
    .returning()

  // 2. Fetch upcoming confirmed appointments
  const upcoming = await db
    .select({
      id: appointment.id,
      startsAt: appointment.startsAt,
      patientUserId: patientProfile.userId,
      professionalUserId: professionalProfile.userId,
    })
    .from(appointment)
    .innerJoin(patientProfile, eq(appointment.patientId, patientProfile.id))
    .innerJoin(professionalProfile, eq(appointment.professionalId, professionalProfile.id))
    .where(eq(appointment.status, 'confirmed'))

  let reminderCount = 0

  for (const apt of upcoming) {
    const diffMs = apt.startsAt.getTime() - now.getTime()
    const diffMinutes = Math.floor(diffMs / (60 * 1000))

    // 24 hours reminder (~between 1410 min and 1440 min)
    if (diffMinutes >= 1410 && diffMinutes <= 1440) {
      await notifier.send(apt.patientUserId, {
        type: 'appointment_reminder',
        payload: { appointmentId: apt.id, startsAt: apt.startsAt, notice: '24h' },
      })
      await notifier.send(apt.professionalUserId, {
        type: 'appointment_reminder',
        payload: { appointmentId: apt.id, startsAt: apt.startsAt, notice: '24h' },
      })
      reminderCount += 2
    }

    // 1 hour reminder (~between 45 min and 75 min)
    if (diffMinutes >= 45 && diffMinutes <= 75) {
      await notifier.send(apt.patientUserId, {
        type: 'appointment_reminder',
        payload: { appointmentId: apt.id, startsAt: apt.startsAt, notice: '1h' },
      })
      await notifier.send(apt.professionalUserId, {
        type: 'appointment_reminder',
        payload: { appointmentId: apt.id, startsAt: apt.startsAt, notice: '1h' },
      })
      reminderCount += 2
    }
  }

  return NextResponse.json({
    ok: true,
    expiredCount: expiredAppointments.length,
    reminderCount,
  })
}
