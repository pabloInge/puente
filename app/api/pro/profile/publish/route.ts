import { NextResponse } from 'next/server'
import { publishProfessionalProfile } from '@/lib/services/profiles'
import { getSession } from '@/lib/session'

export async function POST() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const published = await publishProfessionalProfile(session)
    return NextResponse.json(published)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
