import Link from 'next/link'
import type { ReactNode } from 'react'

import { ThemeToggle } from '@/components/design/theme-toggle'
import { buttonVariants } from '@/components/ui/button'
import { routes } from '@/lib/navigation'
import { cn } from '@/lib/utils'

import { Brand } from './brand'

export function PublicShell({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface-1">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 lg:px-8">
          <Brand />
          <nav aria-label="Navegación principal" className="flex items-center gap-1">
            <Link href={routes.search.href} className={cn(buttonVariants({ variant: 'ghost' }), 'hidden sm:inline-flex')}>
              Buscar profesionales
            </Link>
            <ThemeToggle />
            {actions ?? (
              <>
                <Link href={routes.signIn.href} className={buttonVariants({ variant: 'ghost' })}>
                  Ingresar
                </Link>
                <Link href={routes.signUp.href} className={cn(buttonVariants(), 'hidden sm:inline-flex')}>
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main id="contenido" className="flex flex-1 flex-col">
        {children}
      </main>
      <footer className="border-t border-border bg-surface-1">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>Puente conecta pacientes con profesionales de la psicología en Argentina.</p>
          <p>Si estás en una emergencia, llamá al 135 o al 911.</p>
        </div>
      </footer>
    </div>
  )
}
