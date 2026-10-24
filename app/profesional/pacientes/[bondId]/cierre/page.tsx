import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ClosingSummaryView } from '@/components/domain/summaries/closing-summary-view'
import { routes } from '@/lib/navigation'
import { getBond } from '@/lib/services/bonds'
import { getClosingSummary } from '@/lib/services/summaries'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: routes.bondClosing.label }

export default async function ProfessionalClosingPage({
  params,
}: {
  params: Promise<{ bondId: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/iniciar-sesion')

  const { bondId } = await params
  const bond = await getBond(session, bondId)
  const summary = await getClosingSummary(session, bondId)

  return (
    <div className="mx-auto max-w-4xl py-6">
      <ClosingSummaryView
        bondId={bondId}
        isProfessional={true}
        isBroken={bond.status === 'ended'}
        summary={summary}
      />
    </div>
  )
}
