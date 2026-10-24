import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { branch, coverage } from '@/lib/db/schema'
import { getMyProfessionalProfile } from '@/lib/services/profiles'
import { getSession } from '@/lib/session'
import { ProfessionalProfileForm } from '@/components/domain/profile/professional-profile-form'

export const metadata: Metadata = {
  title: 'Mi Perfil Profesional — Puente',
}

export default async function ProfessionalProfilePage() {
  const session = await getSession()
  if (!session || session.user.role !== 'professional') {
    redirect('/ingresar')
  }

  const profile = await getMyProfessionalProfile(session)

  const availableBranches = await db
    .select({ id: branch.id, name: branch.name })
    .from(branch)
    .where(eq(branch.active, true))
    .orderBy(branch.sort)

  const availableCoverages = await db
    .select({ id: coverage.id, name: coverage.name })
    .from(coverage)
    .where(eq(coverage.active, true))
    .orderBy(coverage.name)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Perfil profesional
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestioná la información que ven los pacientes, tus modalidades de atención y tus credenciales.
        </p>
      </div>

      <ProfessionalProfileForm
        initialData={profile}
        availableBranches={availableBranches}
        availableCoverages={availableCoverages}
      />
    </div>
  )
}
