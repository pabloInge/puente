import { NextResponse } from 'next/server'
import { fulfillClinicalRecordCopy } from '@/lib/services/clinical'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { requestId, exportUrl } = await req.json()
    const fulfilled = await fulfillClinicalRecordCopy(session, requestId, exportUrl)
    return NextResponse.json(fulfilled)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
