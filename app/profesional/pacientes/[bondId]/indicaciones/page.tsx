import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { listIndications } from '@/lib/services/indications'
import { getSession } from '@/lib/session'
import { IndicationsView } from '@/components/domain/indications/indications-view'

type PageProps = {
  params: Promise<{ bondId: string }>
}

export const metadata: Metadata = {
  title: 'Indicaciones y Recursos — Puente',
}

export default async function ProfessionalBondIndicationsPage({ params }: PageProps) {
  const { bondId } = await params
  const session = await getSession()
  if (!session || session.user.role !== 'professional') {
    redirect('/ingresar')
  }

  const indications = await listIndications(session, bondId)

  return (
    <div className="flex flex-col gap-6">
      <IndicationsView bondId={bondId} indications={indications} isProfessional={true} />
    </div>
  )
}
