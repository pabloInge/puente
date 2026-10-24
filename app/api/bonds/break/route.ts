import { NextResponse } from 'next/server'
import { breakBond } from '@/lib/services/bonds'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { bondId, reason } = await req.json()
    const result = await breakBond(session, bondId, reason)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
