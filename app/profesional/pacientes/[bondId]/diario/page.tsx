import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { listJournalEntriesForProfessional } from '@/lib/services/journal'
import { getSession } from '@/lib/session'
import { ProfessionalJournalView } from '@/components/domain/journal/professional-journal-view'

type PageProps = {
  params: Promise<{ bondId: string }>
}

export const metadata: Metadata = {
  title: 'Diario del Paciente — Puente',
}

export default async function ProfessionalBondJournalPage({ params }: PageProps) {
  const { bondId } = await params
  const session = await getSession()
  if (!session || session.user.role !== 'professional') {
    redirect('/ingresar')
  }

  const entries = await listJournalEntriesForProfessional(session, bondId)

  return (
    <div className="flex flex-col gap-6">
      <ProfessionalJournalView entries={entries} />
    </div>
  )
}
