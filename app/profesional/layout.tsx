import { AccountMenu } from '@/components/auth/account-menu'
import { AppShell } from '@/components/layout/app-shell'
import { requireRole } from '@/lib/session'

export default async function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireRole('professional')
  return (
    <AppShell role="professional" account={<AccountMenu name={user.name} email={user.email} />}>
      {children}
    </AppShell>
  )
}
