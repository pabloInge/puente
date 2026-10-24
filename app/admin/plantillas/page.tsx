import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { GlobalTemplatesView } from '@/components/domain/admin/templates-view'
import { routes } from '@/lib/navigation'
import { listGlobalTemplatesAdmin } from '@/lib/services/admin'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: routes.adminTemplates.label }

export default async function AdminTemplatesPage() {
  const session = await getSession()
  if (!session) redirect('/iniciar-sesion')

  const templates = await listGlobalTemplatesAdmin(session)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      <GlobalTemplatesView templates={templates} />
    </div>
  )
}
