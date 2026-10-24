import type { Metadata } from 'next'

import { PrimitivesShowcase } from '@/components/design/primitives-showcase'
import { ThemeToggle } from '@/components/design/theme-toggle'
import { TokenShowcase } from '@/components/design/token-showcase'

export const metadata: Metadata = {
  title: 'Sistema de diseño',
  robots: { index: false, follow: false },
}

export default function DesignPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-surface-1 shadow-2">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-col">
            <h1 className="text-base font-semibold">Sistema de diseño</h1>
            <p className="text-sm text-muted-foreground">Revisión interna de tokens y primitivas (F1-01)</p>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8">
        <TokenShowcase />
        <PrimitivesShowcase />
      </main>
    </div>
  )
}
