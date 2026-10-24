import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { acceptConsent } from '@/lib/services/bonds'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { bondId } = await req.json()
    const headerList = await headers()
    const ip = headerList.get('x-forwarded-for') ?? undefined
    const userAgent = headerList.get('user-agent') ?? undefined

    const activated = await acceptConsent(session, bondId, { ip, userAgent })
    return NextResponse.json(activated)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
