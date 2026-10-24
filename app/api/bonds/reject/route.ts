import { NextResponse } from 'next/server'
import { rejectBondRequest } from '@/lib/services/bonds'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { bondId, reason } = await req.json()
    const rejected = await rejectBondRequest(session, bondId, reason)
    return NextResponse.json(rejected)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
