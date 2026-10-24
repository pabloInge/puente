import { NextResponse } from 'next/server'
import { createClinicalEntry } from '@/lib/services/clinical'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const body = await req.json()
    const entry = await createClinicalEntry(session, body)
    return NextResponse.json(entry)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
