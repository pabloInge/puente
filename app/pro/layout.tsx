'use client'

import { useState, useRef, useEffect, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  House,
  Inbox,
  Maximize2,
  RotateCcw,
  Sparkles,
  Users,
  Wallet,
  X,
  ArrowUp,
} from 'lucide-react'
import { Brand } from '@/components/layout/brand'
import { Button, buttonVariants } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  useDemoProfesional,
  resetDemoProfesional,
  responderAsistentePro,
  nombreCompleto,
  iniciales,
} from '@/lib/puente-pro-demo'

const NAV_ITEMS = [
  { href: '/pro', label: 'Inicio', icon: House },
  { href: '/pro/solicitudes', label: 'Solicitudes', icon: Inbox, badge: true },
  { href: '/pro/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/pro/pacientes', label: 'Pacientes', icon: Users },
  { href: '/pro/cobros', label: 'Cobros', icon: Wallet },
  { href: '/pro/asistente', label: 'Asistente IA', corto: 'Asistente', icon: Sparkles },
]

const PROMPTS_ASISTENTE = [
  '¿Qué tengo hoy?',
  '¿Cómo viene Lucía?',
  '¿Quién me debe?',
  '¿Tengo solicitudes nuevas?',
  'Técnicas para ansiedad',
]

interface AsistenteContextType {
  mensajes: { role: 'user' | 'assistant'; content: string }[]
  pensando: boolean
  abierto: boolean
  abrir: (preguntaInicial?: string) => void
  cerrar: () => void
  preguntar: (texto: string) => Promise<void>
  nuevaCharla: () => void
}

const AsistenteContext = createContext<AsistenteContextType | null>(null)

export function useAsistenteContext() {
  const ctx = useContext(AsistenteContext)
  if (!ctx) throw new Error('useAsistenteContext debe usarse dentro de AsistenteProvider')
  return ctx
}

export function AsistenteChatBox({ compacto = false }: { compacto?: boolean }) {
  const { mensajes, pensando, preguntar } = useAsistenteContext()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensajes.length, pensando])

  const handleEnviar = () => {
    if (!input.trim() || pensando) return
    preguntar(input)
    setInput('')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={`flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto ${
          compacto ? 'p-4' : 'py-2'
        }`}
        aria-live="polite"
      >
        {mensajes.length === 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rosa-claro text-rosa">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <p className="text-pretty text-[15px] leading-relaxed text-tinta">
                Preguntame por tus pacientes, tu agenda o tus cobros. Uso los datos de tu panel; el criterio clínico siempre es tuyo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PROMPTS_ASISTENTE.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => preguntar(p)}
                  className="rounded-full border border-linea px-3.5 py-1.5 text-sm text-tinta transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          mensajes.map((m, i) => (
            <div
              key={i}
              className={`flex animate-rise ${
                m.role === 'user' ? 'justify-end' : 'items-end gap-2.5'
              }`}
            >
              {m.role === 'assistant' && (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-azul text-white">
                  <Sparkles className="size-4" />
                </span>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                  m.role === 'user'
                    ? 'rounded-br-md bg-azul text-white'
                    : 'rounded-bl-md bg-card text-tinta ring-1 ring-border'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))
        )}

        {pensando && (
          <div className="flex items-end gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-azul text-white">
              <Sparkles className="size-4" />
            </span>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-card px-4 py-3.5 ring-1 ring-border">
              <span className="size-1.5 animate-typing rounded-full bg-gris" />
              <span
                className="size-1.5 animate-typing rounded-full bg-gris"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="size-1.5 animate-typing rounded-full bg-gris"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleEnviar()
        }}
        className={`flex items-end gap-2 border-t border-linea ${
          compacto ? 'bg-background p-3' : 'pt-4'
        }`}
      >
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleEnviar()
            }
          }}
          placeholder="Ej.: Resumime a Tomás antes de la sesión"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-input bg-card px-3.5 py-2.5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || pensando}
          aria-label="Enviar pregunta"
        >
          <ArrowUp className="size-5" />
        </Button>
      </form>
    </div>
  )
}

function AsistenteDrawer() {
  const { abierto, abrir, cerrar, mensajes, nuevaCharla } = useAsistenteContext()
  const pathname = usePathname() || ''
  const isFullScreen = pathname.startsWith('/pro/asistente')

  if (isFullScreen) return null

  return (
    <>
      {!abierto && (
        <button
          type="button"
          onClick={() => abrir()}
          className="fixed right-4 bottom-20 z-40 flex h-12 items-center gap-2 rounded-full bg-azul pr-5 pl-4 font-medium text-white shadow-[0_12px_30px_-10px_rgb(35_48_79/0.55)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:right-8 lg:bottom-8"
        >
          <Sparkles className="size-4 text-rosa-claro" aria-hidden="true" />
          Asistente IA
          {mensajes.length > 0 && <span className="size-2 rounded-full bg-rosa" />}
        </button>
      )}

      <aside
        id="asistente-panel"
        aria-label="Asistente IA"
        aria-hidden={!abierto}
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-background transition-transform duration-300 ease-out sm:w-[420px] ${
          abierto ? 'translate-x-0 shadow-[-24px_0_60px_-30px_rgb(35_48_79/0.35)]' : 'translate-x-full invisible'
        }`}
      >
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <Sparkles className="size-4 text-rosa" aria-hidden="true" />
          <h2 className="flex-1 font-heading text-base font-semibold text-tinta">
            Asistente IA
          </h2>
          {mensajes.length > 0 && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={nuevaCharla}
              aria-label="Empezar una charla nueva"
              title="Charla nueva"
            >
              <RotateCcw className="size-4" />
            </Button>
          )}
          <Link
            href="/pro/asistente"
            onClick={cerrar}
            className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
            aria-label="Abrir en pantalla completa"
            title="Pantalla completa"
          >
            <Maximize2 className="size-4" />
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={cerrar}
            aria-label="Cerrar asistente"
          >
            <X className="size-4" />
          </Button>
        </header>

        <AsistenteChatBox compacto />
      </aside>
    </>
  )
}

export default function ProLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/pro'
  const estadoPro = useDemoProfesional()
  const pro = estadoPro.profesional

  const [mensajes, setMensajes] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [pensando, setPensando] = useState(false)
  const [abierto, setAbierto] = useState(false)

  const nuevasSolicitudes = estadoPro.solicitudes.filter((s) => s.estado === 'nueva').length

  const preguntar = async (texto: string) => {
    const clean = texto.trim()
    if (!clean) return
    const nuevos = [...mensajes, { role: 'user' as const, content: clean }]
    setMensajes(nuevos)
    setPensando(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      const res = responderAsistentePro(estadoPro, nuevos)
      setMensajes([...nuevos, { role: 'assistant', content: res }])
    } finally {
      setPensando(false)
    }
  }

  const abrir = (inicial?: string) => {
    setAbierto(true)
    if (inicial) preguntar(inicial)
  }

  const cerrar = () => setAbierto(false)
  const nuevaCharla = () => setMensajes([])

  const isActive = (href: string) => {
    if (href === '/pro') return pathname === '/pro'
    return pathname.startsWith(href)
  }

  const handleReset = () => {
    resetDemoProfesional()
    toast.success('Datos demo reiniciados')
  }

  return (
    <AsistenteContext.Provider
      value={{ mensajes, pensando, abierto, abrir, cerrar, preguntar, nuevaCharla }}
    >
      <div className="min-h-dvh bg-background lg:flex">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground lg:flex">
          <div className="px-2 pt-1">
            <Brand href="/pro" />
          </div>

          <nav aria-label="Panel profesional" className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60'
                  }`}
                >
                  <Icon
                    className={`size-[18px] ${active ? 'text-sidebar-primary' : ''}`}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && nuevasSolicitudes > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
                      {nuevasSolicitudes}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="justify-start text-xs text-muted-foreground gap-2"
            >
              <RotateCcw className="size-3.5" />
              Reiniciar datos demo
            </Button>

            {pro && (
              <div className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-sidebar-border">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary font-heading font-semibold text-xs text-secondary-foreground">
                  {iniciales(pro)}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">
                    Lic. {nombreCompleto(pro)}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {pro.matricula} · {pro.enfoques[0]}
                  </span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Contenido principal */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
            <Brand href="/pro" />
            <Button variant="ghost" size="icon" onClick={handleReset} aria-label="Reiniciar demo">
              <RotateCcw className="size-4" />
            </Button>
          </header>

          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pt-6 pb-40 md:px-8 md:pt-8 lg:pb-28">
            {children}
          </main>
        </div>

        {/* Navegación móvil inferior */}
        <nav
          aria-label="Panel profesional"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <span className="relative">
                  <Icon className="size-5" />
                  {item.badge && nuevasSolicitudes > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                      {nuevasSolicitudes}
                    </span>
                  )}
                </span>
                {item.corto ?? item.label}
              </Link>
            )
          })}
        </nav>

        <AsistenteDrawer />
      </div>
    </AsistenteContext.Provider>
  )
}
