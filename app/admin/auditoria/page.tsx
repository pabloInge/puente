import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuditView } from '@/components/domain/admin/audit-view'
import { routes } from '@/lib/navigation'
import { listAuditLogsAdmin } from '@/lib/services/admin'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: routes.adminAudit.label }

export default async function AdminAuditPage() {
  const session = await getSession()
  if (!session) redirect('/iniciar-sesion')

  const logs = await listAuditLogsAdmin(session, { limit: 150 })

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      <AuditView initialLogs={logs} />
    </div>
  )
}
