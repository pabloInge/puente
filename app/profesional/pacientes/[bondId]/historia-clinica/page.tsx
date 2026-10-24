import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { listClinicalEntries, listClinicalTemplates } from '@/lib/services/clinical'
import { getSession } from '@/lib/session'
import { ClinicalEntriesView } from '@/components/domain/clinical/clinical-entries-view'

type PageProps = {
  params: Promise<{ bondId: string }>
}

export const metadata: Metadata = {
  title: 'Historia Clínica — Puente',
}

export default async function ProfessionalClinicalRecordPage({ params }: PageProps) {
  const { bondId } = await params
  const session = await getSession()
  if (!session || session.user.role !== 'professional') {
    redirect('/ingresar')
  }

  const entries = await listClinicalEntries(session, bondId)
  const templates = await listClinicalTemplates(session)

  return (
    <div className="flex flex-col gap-6">
      <ClinicalEntriesView bondId={bondId} entries={entries} templates={templates} />
    </div>
  )
}
