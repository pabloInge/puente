import { AccountMenu } from '@/components/auth/account-menu'
import { AppShell } from '@/components/layout/app-shell'
import { requireRole } from '@/lib/session'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireRole('admin')
  return (
    <AppShell role="admin" account={<AccountMenu name={user.name} email={user.email} />}>
      {children}
    </AppShell>
  )
}
