'use client'

import { RotateCcw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAsistenteContext, AsistenteChatBox } from '../layout'

const PROMPTS_SUGERIDOS = [
  '¿Qué tengo hoy?',
  '¿Cómo viene Lucía?',
  '¿Quién me debe?',
  '¿Tengo solicitudes nuevas?',
  'Técnicas para ansiedad',
]

export default function AsistenteProPage() {
  const { mensajes, preguntar, nuevaCharla, pensando } = useAsistenteContext()

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Asistente IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Preparar sesiones, revisar la agenda o ver quién debe, sin salir del panel.
          </p>
        </div>

        {mensajes.length > 0 && (
          <Button variant="outline" onClick={nuevaCharla} className="gap-2">
            <RotateCcw className="size-4" />
            Charla nueva
          </Button>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
        {/* Chat principal */}
        <section className="flex h-[calc(100dvh-15rem)] min-h-[420px] flex-col rounded-2xl bg-card p-5 ring-1 ring-border">
          <AsistenteChatBox />
        </section>

        {/* Sugerencias y disclaimer */}
        <aside className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
            <h2 className="font-heading text-base font-semibold text-tinta">
              Para preguntar
            </h2>
            <ul className="flex flex-col gap-1">
              {PROMPTS_SUGERIDOS.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    disabled={pensando}
                    onClick={() => preguntar(p)}
                    className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-azul transition-colors hover:bg-secondary disabled:opacity-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className="flex gap-2.5 rounded-2xl bg-rosa-claro/60 p-4 text-sm leading-relaxed text-tinta">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-rosa" aria-hidden="true" />
            Responde con los datos de tu panel. No diagnostica ni reemplaza tu criterio clínico.
          </p>
        </aside>
      </div>
    </>
  )
}
