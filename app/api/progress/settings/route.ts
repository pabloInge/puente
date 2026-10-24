import { NextResponse } from 'next/server'
import { updateProgressSettings } from '@/lib/services/progress'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { bondId, ...data } = await req.json()
    await updateProgressSettings(session, bondId, data)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
