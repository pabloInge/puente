import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CoveragesView } from '@/components/domain/admin/coverages-view'
import { routes } from '@/lib/navigation'
import { listCoveragesAdmin } from '@/lib/services/admin'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: routes.adminCoverages.label }

export default async function AdminCoveragesPage() {
  const session = await getSession()
  if (!session) redirect('/iniciar-sesion')

  const coverages = await listCoveragesAdmin(session)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      <CoveragesView coverages={coverages as any} />
    </div>
  )
}
