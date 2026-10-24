import { NextResponse } from 'next/server'
import { requestClinicalRecordCopy } from '@/lib/services/clinical'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { bondId } = await req.json()
    const request = await requestClinicalRecordCopy(session, bondId)
    return NextResponse.json(request)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
