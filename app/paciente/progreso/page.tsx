import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { ProgressView } from '@/components/domain/progress/progress-view'
import { db } from '@/lib/db'
import { bond, patientProfile } from '@/lib/db/schema'
import { routes } from '@/lib/navigation'
import { getProgress } from '@/lib/services/progress'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: routes.patientProgress.label }

export default async function PatientProgressPage() {
  const session = await getSession()
  if (!session) redirect('/iniciar-sesion')

  const [profile] = await db
    .select()
    .from(patientProfile)
    .where(eq(patientProfile.userId, session.user.id))
    .limit(1)

  if (!profile) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Perfil de paciente no configurado.
      </div>
    )
  }

  const [activeBond] = await db
    .select()
    .from(bond)
    .where(eq(bond.patientId, profile.id))
    .limit(1)

  if (!activeBond) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No tenés un tratamiento activo para visualizar el progreso.
      </div>
    )
  }

  const data = await getProgress(session, activeBond.id)

  return (
    <div className="mx-auto max-w-4xl py-6">
      <ProgressView
        bondId={activeBond.id}
        isProfessional={false}
        settings={data.settings as any}
        view={data.view}
        updates={data.updates}
      />
    </div>
  )
}
