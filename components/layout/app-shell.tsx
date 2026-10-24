import type { ReactNode } from 'react'

import { ThemeToggle } from '@/components/design/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { roleHome, roleLabel, type Role } from '@/lib/navigation'

import { BottomNav, SidebarNav } from './app-nav'
import { Brand } from './brand'

type AppShellProps = {
  role: Role
  children: ReactNode
  /** Menú de cuenta (lo provee F1-04). */
  account?: ReactNode
}

export function AppShell({ role, children, account }: AppShellProps) {
  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-border bg-surface-1 px-3 py-4 lg:flex">
        <div className="flex items-center justify-between px-2">
          <Brand href={roleHome[role]} />
        </div>
        <Badge variant="secondary" className="mx-2 w-fit">
          {roleLabel[role]}
        </Badge>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav role={role} />
        </div>
        <div className="flex items-center justify-between gap-2 px-2">
          {account}
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-surface-1 px-4 lg:hidden">
          <Brand href={roleHome[role]} />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {account}
          </div>
        </header>
        <main id="contenido" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pt-6 pb-24 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <BottomNav role={role} />
    </div>
  )
}
