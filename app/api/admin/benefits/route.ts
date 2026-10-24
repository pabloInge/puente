import { NextResponse } from 'next/server'
import { createBenefit, deleteBenefit } from '@/lib/services/admin'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const body = await req.json()

    if (body.action === 'create') {
      const created = await createBenefit(session, body.data)
      return NextResponse.json(created)
    }

    if (body.action === 'delete') {
      const result = await deleteBenefit(session, body.id)
      return NextResponse.json(result)
    }

    return NextResponse.json({ message: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
