import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { UsersView } from '@/components/domain/admin/users-view'
import { routes } from '@/lib/navigation'
import { listUsersAdmin } from '@/lib/services/admin'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: routes.adminUsers.label }

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session) redirect('/iniciar-sesion')

  const users = await listUsersAdmin(session, { limit: 100 })

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      <UsersView initialUsers={users as any} />
    </div>
  )
}
