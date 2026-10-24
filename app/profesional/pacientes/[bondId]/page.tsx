import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { decryptNullable } from '@/lib/crypto'
import { db } from '@/lib/db'
import { patientProfile } from '@/lib/db/schema'
import { requireBondAccess } from '@/lib/services/bond-access'
import { getSession } from '@/lib/session'
import { getTimelineEventsForBond } from '@/lib/timeline'
import { PatientBondDetailView } from '@/components/domain/clinical/patient-bond-detail-view'

type PageProps = {
  params: Promise<{ bondId: string }>
}

export const metadata: Metadata = {
  title: 'Ficha del Paciente — Puente',
}

export default async function ProfessionalBondDetailPage({ params }: PageProps) {
  const { bondId } = await params
  const session = await getSession()
  if (!session || session.user.role !== 'professional') {
    redirect('/ingresar')
  }

  let access
  try {
    access = await requireBondAccess(session, bondId, 'read-historical', { party: 'professional' })
  } catch {
    notFound()
  }

  const [patient] = await db
    .select()
    .from(patientProfile)
    .where(eq(patientProfile.id, access.bond.patientId))
    .limit(1)

  if (!patient) notFound()

  const timeline = await getTimelineEventsForBond(bondId)

  const patientData = {
    firstName: patient.firstName,
    lastName: patient.lastName,
    dni: access.bond.status === 'active' ? decryptNullable(patient.dni) : null,
    phone: access.bond.status === 'active' ? patient.phone : null,
    city: patient.city,
    province: patient.province,
    emergencyContactName: access.bond.status === 'active' ? patient.emergencyContactName : null,
    emergencyContactPhone: access.bond.status === 'active' ? patient.emergencyContactPhone : null,
    initialTopics: patient.initialTopics,
  }

  return (
    <div className="flex flex-col gap-6">
      <PatientBondDetailView
        bondId={bondId}
        bondStatus={access.bond.status}
        patient={patientData}
        timeline={timeline}
      />
    </div>
  )
}
