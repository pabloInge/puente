import { Brand } from '@/components/layout/brand'

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-14 items-center border-b border-border bg-surface-1 px-4">
        <Brand />
      </header>
      <main id="contenido" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
