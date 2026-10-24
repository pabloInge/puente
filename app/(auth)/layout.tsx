import { Brand } from '@/components/layout/brand'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <Brand className="mb-8" />
      <main id="contenido" className="flex w-full max-w-md flex-col gap-6 rounded-3xl border border-linea bg-card p-6 shadow-sm sm:p-8">
        {children}
      </main>
    </div>
  )
}
