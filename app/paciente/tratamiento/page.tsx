import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { consentVersion, intake, professionalProfile } from '@/lib/db/schema'
import { getOpenBondForPatient } from '@/lib/services/bond-access'
import { getSession } from '@/lib/session'
import { PatientTreatmentView } from '@/components/domain/bond/patient-treatment-view'

export const metadata: Metadata = {
  title: 'Mi Tratamiento — Puente',
}

export default async function PatientTreatmentPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'patient') {
    redirect('/ingresar')
  }

  const openBond = await getOpenBondForPatient(session)

  let bondDetails = null
  let intakeDetails = null

  if (openBond) {
    const [prof] = await db
      .select({
        displayName: professionalProfile.displayName,
        photoUrl: professionalProfile.photoUrl,
        licenseNumber: professionalProfile.licenseNumber,
        licenseJurisdiction: professionalProfile.licenseJurisdiction,
      })
      .from(professionalProfile)
      .where(eq(professionalProfile.id, openBond.professionalId))
      .limit(1)

    bondDetails = {
      id: openBond.id,
      status: openBond.status,
      requestedAt: openBond.requestedAt,
      acceptedAt: openBond.acceptedAt,
      activatedAt: openBond.activatedAt,
      professionalName: prof?.displayName ?? 'Profesional',
      professionalPhotoUrl: prof?.photoUrl ?? null,
      licenseNumber: prof?.licenseNumber ?? null,
      licenseJurisdiction: prof?.licenseJurisdiction ?? null,
    }

    if (openBond.status === 'active') {
      const [it] = await db
        .select()
        .from(intake)
        .where(eq(intake.bondId, openBond.id))
        .limit(1)

      if (it) {
        intakeDetails = {
          needs: it.needs,
          reasonToStart: it.reasonToStart,
          submittedAt: it.submittedAt,
        }
      }
    }
  }

  // Get current active informed consent
  const [currentConsent] = await db
    .select({ bodyMd: consentVersion.bodyMd })
    .from(consentVersion)
    .where(and(eq(consentVersion.kind, 'informed_consent'), eq(consentVersion.isCurrent, true)))
    .limit(1)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Mi tratamiento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estado de tu vínculo terapéutico, consentimiento informado y ficha de inicio.
        </p>
      </div>

      <PatientTreatmentView
        bond={bondDetails}
        consentText={currentConsent?.bodyMd ?? null}
        intakeData={intakeDetails}
      />
    </div>
  )
}
