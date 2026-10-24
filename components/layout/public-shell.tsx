'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Brand } from './brand'

export function PublicShell({ children }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <Brand />
        <Link
          href="/pro"
          className="font-medium text-azul underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
        >
          Soy profesional
        </Link>
      </header>
      <main id="contenido" className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  )
}
