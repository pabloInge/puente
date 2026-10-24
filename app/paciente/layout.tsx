import { AccountMenu } from '@/components/auth/account-menu'
import { AppShell } from '@/components/layout/app-shell'
import { requireRole } from '@/lib/session'

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireRole('patient')
  return (
    <AppShell role="patient" account={<AccountMenu name={user.name} email={user.email} />}>
      {children}
    </AppShell>
  )
}
