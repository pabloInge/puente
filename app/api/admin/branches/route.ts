import { NextResponse } from 'next/server'
import { createBranch, updateBranch } from '@/lib/services/admin'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const body = await req.json()

    if (body.action === 'create') {
      const created = await createBranch(session, body.data)
      return NextResponse.json(created)
    }

    if (body.action === 'update') {
      const updated = await updateBranch(session, body.id, body.data)
      return NextResponse.json(updated)
    }

    return NextResponse.json({ message: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
