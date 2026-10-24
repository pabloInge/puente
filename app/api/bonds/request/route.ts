import { NextResponse } from 'next/server'
import { requestBond } from '@/lib/services/bonds'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const newBond = await requestBond(session, body)

    return NextResponse.json({ bondId: newBond.id })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error al solicitar vínculo' },
      { status: error.status || 400 },
    )
  }
}
