import { NextResponse } from 'next/server'
import { getMyProfessionalProfile, updateProfessionalProfile } from '@/lib/services/profiles'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const profile = await getMyProfessionalProfile(session)
    return NextResponse.json(profile)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const body = await req.json()
    const updated = await updateProfessionalProfile(session, body)
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
