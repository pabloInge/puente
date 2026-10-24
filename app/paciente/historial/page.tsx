import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getPastExperiences } from '@/lib/services/profiles'
import { getSession } from '@/lib/session'
import { PastExperiencesView } from '@/components/domain/profile/past-experiences-view'

export const metadata: Metadata = {
  title: 'Historial y Experiencias — Puente',
}

export default async function PatientHistoryPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'patient') {
    redirect('/ingresar')
  }

  const experiences = await getPastExperiences(session)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Historial terapéutico
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultá tus experiencias pasadas y resúmenes de cierre acumulados.
        </p>
      </div>

      <PastExperiencesView experiences={experiences} />
    </div>
  )
}
