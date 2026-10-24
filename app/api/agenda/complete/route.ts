import { NextResponse } from 'next/server'
import { completeAppointment } from '@/lib/services/agenda'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { appointmentId } = await req.json()
    const completed = await completeAppointment(session, appointmentId)
    return NextResponse.json(completed)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
