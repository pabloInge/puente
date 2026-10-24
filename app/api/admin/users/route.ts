import { NextResponse } from 'next/server'
import { setUserStatusAdmin } from '@/lib/services/admin'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { userId, status } = await req.json()
    const updated = await setUserStatusAdmin(session, userId, status)
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
