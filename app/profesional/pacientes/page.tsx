import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bond, patientProfile } from '@/lib/db/schema'
import { getProfessionalProfileId } from '@/lib/services/bond-access'
import { getSession } from '@/lib/session'
import { PatientsListView } from '@/components/domain/clinical/patients-list-view'

export const metadata: Metadata = {
  title: 'Pacientes — Puente',
}

export default async function ProfessionalPatientsPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'professional') {
    redirect('/ingresar')
  }

  const profId = await getProfessionalProfileId(session.user.id)
  if (!profId) redirect('/ingresar')

  const bonds = await db
    .select({
      id: bond.id,
      status: bond.status,
      requestedAt: bond.requestedAt,
      activatedAt: bond.activatedAt,
      endedAt: bond.endedAt,
      patientFirstName: patientProfile.firstName,
      patientLastName: patientProfile.lastName,
      patientProvince: patientProfile.province,
      patientCity: patientProfile.city,
    })
    .from(bond)
    .innerJoin(patientProfile, eq(bond.patientId, patientProfile.id))
    .where(eq(bond.professionalId, profId))
    .orderBy(desc(bond.activatedAt))

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Pacientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestión de vínculos terapéuticos activos e históricos.
        </p>
      </div>

      <PatientsListView bonds={bonds} />
    </div>
  )
}
