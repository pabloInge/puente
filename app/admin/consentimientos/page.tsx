import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ConsentsView } from '@/components/domain/admin/consents-view'
import { routes } from '@/lib/navigation'
import { listConsentVersionsAdmin } from '@/lib/services/admin'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: routes.adminConsents.label }

export default async function AdminConsentsPage() {
  const session = await getSession()
  if (!session) redirect('/iniciar-sesion')

  const versions = await listConsentVersionsAdmin(session)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      <ConsentsView versions={versions} />
    </div>
  )
}
