import { NextResponse } from 'next/server'
import { createJournalEntry, listJournalEntriesForPatient } from '@/lib/services/journal'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const res = await listJournalEntriesForPatient(session)
    return NextResponse.json(res)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const body = await req.json()
    const entry = await createJournalEntry(session, body)
    return NextResponse.json(entry)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
