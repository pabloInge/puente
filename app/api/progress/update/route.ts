import { NextResponse } from 'next/server'
import { addProgressUpdate } from '@/lib/services/progress'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const body = await req.json()
    const update = await addProgressUpdate(session, body)
    return NextResponse.json(update)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
