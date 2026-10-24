import { NextResponse } from 'next/server'
import { publishConsentVersion } from '@/lib/services/admin'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { kind, version, bodyMd } = await req.json()
    const published = await publishConsentVersion(session, kind, version, bodyMd)
    return NextResponse.json(published)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
