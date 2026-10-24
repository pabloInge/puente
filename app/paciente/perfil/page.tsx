import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { coverage } from '@/lib/db/schema'
import { getMyPatientProfile } from '@/lib/services/profiles'
import { getSession } from '@/lib/session'
import { PatientProfileForm } from '@/components/domain/profile/patient-profile-form'

export const metadata: Metadata = {
  title: 'Mi Perfil — Puente',
}

export default async function PatientProfilePage() {
  const session = await getSession()
  if (!session || session.user.role !== 'patient') {
    redirect('/ingresar')
  }

  const profile = await getMyPatientProfile(session)
  const coverages = await db
    .select({ id: coverage.id, name: coverage.name })
    .from(coverage)
    .where(eq(coverage.active, true))
    .orderBy(coverage.name)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Mi perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administrá tus datos personales, información de cobertura y temas iniciales.
        </p>
      </div>

      <PatientProfileForm initialData={profile} coverages={coverages} />
    </div>
  )
}
