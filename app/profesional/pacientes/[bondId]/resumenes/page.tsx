import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { HistoricalSummaryView } from '@/components/domain/summaries/historical-summary-view'
import { WeeklySummaryView } from '@/components/domain/summaries/weekly-summary-view'
import { routes } from '@/lib/navigation'
import {
  getHistoricSummaryData,
  listWeeklySummaries,
} from '@/lib/services/summaries'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: routes.bondSummaries.label }

export default async function ProfessionalSummariesPage({
  params,
}: {
  params: Promise<{ bondId: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/iniciar-sesion')

  const { bondId } = await params
  const summaries = await listWeeklySummaries(session, bondId)
  const historicData = await getHistoricSummaryData(session, bondId)

  return (
    <div className="mx-auto max-w-4xl py-6 flex flex-col gap-10">
      <HistoricalSummaryView
        bondId={bondId}
        isProfessional={true}
        startingPoint={historicData.startingPoint}
        weeksCount={historicData.weeks.length}
        progressCount={historicData.progress.length}
        progressPoints={historicData.progress}
      />

      <div className="border-t border-border pt-6">
        <WeeklySummaryView
          bondId={bondId}
          isProfessional={true}
          summaries={summaries}
        />
      </div>
    </div>
  )
}
