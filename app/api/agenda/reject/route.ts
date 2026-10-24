import { NextResponse } from 'next/server'
import { rejectAppointment } from '@/lib/services/agenda'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { appointmentId, reason } = await req.json()
    const rejected = await rejectAppointment(session, appointmentId, reason)
    return NextResponse.json(rejected)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
