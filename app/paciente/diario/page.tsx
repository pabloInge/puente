import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { listJournalEntriesForPatient } from '@/lib/services/journal'
import { getSession } from '@/lib/session'
import { PatientJournalView } from '@/components/domain/journal/patient-journal-view'

export const metadata: Metadata = {
  title: 'Mi Diario — Puente',
}

export default async function PatientJournalPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'patient') {
    redirect('/ingresar')
  }

  const { entries, hasBond } = await listJournalEntriesForPatient(session)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Diario personal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Anotá tus conflictos, necesidades y cómo te sentís para conversar en tu próxima sesión.
        </p>
      </div>

      <PatientJournalView entries={entries} hasBond={hasBond} />
    </div>
  )
}
