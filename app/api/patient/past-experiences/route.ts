import { NextResponse } from 'next/server'
import { createPastExperience, deletePastExperience, getPastExperiences } from '@/lib/services/profiles'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const list = await getPastExperiences(session)
    return NextResponse.json(list)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const body = await req.json()
    const created = await createPastExperience(session, body)
    return NextResponse.json(created)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ message: 'ID requerido' }, { status: 400 })
    const deleted = await deletePastExperience(session, id)
    return NextResponse.json(deleted)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
