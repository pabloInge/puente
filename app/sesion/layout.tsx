import { AccountMenu } from '@/components/auth/account-menu'
import { Brand } from '@/components/layout/brand'
import { roleHome } from '@/lib/navigation'
import { requireSession } from '@/lib/session'

export default async function SessionLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession()
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-surface-1 px-4">
        <Brand href={roleHome[user.role]} />
        <AccountMenu name={user.name} email={user.email} />
      </header>
      <main id="contenido" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
