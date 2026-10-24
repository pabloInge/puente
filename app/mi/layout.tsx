'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Ellipsis,
  House,
  NotebookPen,
  Phone,
  Sprout,
} from 'lucide-react'
import { Brand } from '@/components/layout/brand'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  useSesionPaciente,
  guardarSesion,
  crearSesionDemoCompleta,
  activarDemoPaciente,
} from '@/lib/puente-demo'

const NAV_ITEMS = [
  { href: '/mi', label: 'Inicio', icon: House },
  { href: '/mi/diario', label: 'Diario', icon: NotebookPen },
  { href: '/mi/proceso', label: 'Mi proceso', icon: Sprout },
  { href: '/mi/mas', label: 'Más', icon: Ellipsis },
]

function BotonAyudaModal() {
  const [open, setOpen] = useState(false)
  const lineas = [
    { tel: '911', nombre: '911', detalle: 'Emergencias' },
    { tel: '107', nombre: '107', detalle: 'Emergencias médicas (SAME)' },
    { tel: '08009990091', nombre: '0800 999 0091', detalle: 'Línea de Salud Mental · gratuita, 24 hs' },
  ]

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-rosa/50 text-tinta hover:bg-rosa-claro/50"
      >
        <span className="size-2 rounded-full bg-rosa mr-1.5" aria-hidden="true" />
        Necesito ayuda ahora
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Estamos acá</DialogTitle>
            <DialogDescription>
              Si estás en peligro o sentís que podés hacerte daño, llamá ahora. Atienden personas, a cualquier hora.
            </DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-2">
            {lineas.map((item) => (
              <li key={item.tel}>
                <a
                  href={`tel:${item.tel}`}
                  className="flex min-h-14 items-center gap-3 rounded-2xl border border-linea bg-card px-4 text-tinta transition-colors hover:border-azul/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <Phone className="size-5 shrink-0 text-azul" aria-hidden="true" />
                  <span className="flex flex-col">
                    <span className="font-semibold">Llamar al {item.nombre}</span>
                    <span className="text-sm text-gris">{item.detalle}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function MiEspacioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/mi'
  const sesion = useSesionPaciente()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!sesion) {
        guardarSesion(crearSesionDemoCompleta())
      } else if (!sesion.panel) {
        guardarSesion(activarDemoPaciente(sesion))
      }
    }
  }, [sesion])

  const isActive = (href: string) => {
    if (href === '/mi') return pathname === '/mi'
    if (href === '/mi/mas') return pathname.startsWith('/mi/mas') || pathname.startsWith('/mi/informe')
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-linea bg-background/95 backdrop-blur print:hidden">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-4 px-5">
          <Brand href="/mi" />
          <nav aria-label="Mi espacio" className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active ? 'bg-azul/10 text-azul' : 'text-gris hover:text-tinta'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
          <BotonAyudaModal />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 pt-6 pb-28 md:pb-12 print:p-0">
        {children}
      </main>

      {/* Navegación móvil inferior */}
      <nav
        aria-label="Mi espacio"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-linea bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${
                active ? 'text-azul' : 'text-gris'
              }`}
            >
              <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
