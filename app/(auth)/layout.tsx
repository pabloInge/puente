import { Brand } from '@/components/layout/brand'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-surface-2 px-4 py-10">
      <Brand className="mb-8" />
      <main id="contenido" className="flex w-full max-w-md flex-col gap-6 rounded-lg border border-border bg-surface-1 p-6 shadow-8 sm:p-8">
        {children}
      </main>
    </div>
  )
}
