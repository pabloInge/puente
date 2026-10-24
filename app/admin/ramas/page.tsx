import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BranchesView } from '@/components/domain/admin/branches-view'
import { routes } from '@/lib/navigation'
import { listBranchesAdmin } from '@/lib/services/admin'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: routes.adminBranches.label }

export default async function AdminBranchesPage() {
  const session = await getSession()
  if (!session) redirect('/iniciar-sesion')

  const branches = await listBranchesAdmin(session)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      <BranchesView branches={branches} />
    </div>
  )
}
