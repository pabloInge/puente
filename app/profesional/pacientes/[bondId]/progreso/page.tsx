import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ProgressView } from '@/components/domain/progress/progress-view'
import { routes } from '@/lib/navigation'
import { getProgress } from '@/lib/services/progress'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: routes.bondProgress.label }

export default async function ProfessionalProgressPage({
  params,
}: {
  params: Promise<{ bondId: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/iniciar-sesion')

  const { bondId } = await params
  const data = await getProgress(session, bondId)

  return (
    <div className="mx-auto max-w-4xl py-6">
      <ProgressView
        bondId={bondId}
        isProfessional={true}
        settings={data.settings as any}
        view={data.view}
        updates={data.updates}
      />
    </div>
  )
}
