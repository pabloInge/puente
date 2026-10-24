import { NextResponse } from 'next/server'
import { acceptBondRequest } from '@/lib/services/bonds'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { bondId } = await req.json()
    const accepted = await acceptBondRequest(session, bondId)
    return NextResponse.json(accepted)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
