'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Frown,
  Laugh,
  Lock,
  Meh,
  PenLine,
  Smile,
  Star,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  useSesionPaciente,
  updatePanel,
  formatFechaLarga,
  formatHora,
  formatFechaCorta,
  PROFESIONALES_MOCK,
  EntradaDiario,
} from '@/lib/puente-demo'

const CARITAS = [
  { valor: 1, icon: Frown, label: 'Muy mal' },
  { valor: 2, icon: Frown, label: 'Mal' },
  { valor: 3, icon: Meh, label: 'Más o menos' },
  { valor: 4, icon: Smile, label: 'Bien' },
  { valor: 5, icon: Laugh, label: 'Muy bien' },
]

const ETIQUETAS_SUGERIDAS = [
  'trabajo',
  'vínculos',
  'cuerpo',
  'sueño',
  'familia',
  'logro',
  'otra',
]

const PROMPTS_DIARIOS = [
  '¿Qué fue lo más difícil de hoy?',
  '¿Algo que te haya salido bien?',
  '¿Qué te gustaría decirle a alguien y no pudiste?',
]

function getPromptAleatorio() {
  const d = new Date()
  return PROMPTS_DIARIOS[d.getDate() % PROMPTS_DIARIOS.length]
}

function GraficoAnimo({ entradas, dias = 30 }: { entradas: EntradaDiario[]; dias?: number }) {
  const maxTime = new Date()
  maxTime.setHours(23, 59, 59, 999)
  const minTime = maxTime.getTime() - dias * 86400 * 1000

  const puntos = entradas
    .filter((e) => new Date(e.fecha).getTime() >= minTime)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((e) => {
      const x = ((new Date(e.fecha).getTime() - minTime) / (maxTime.getTime() - minTime)) * 300
      const y = 52 - ((e.animo - 1) / 4) * 44
      return { x, y, e }
    })

  if (puntos.length === 0) {
    return (
      <p className="text-sm text-gris">
        Cuando escribas algunos días, acá vas a ver cómo viene tu ánimo.
      </p>
    )
  }

  const prom = puntos.reduce((acc, p) => acc + p.e.animo, 0) / puntos.length

  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox="0 0 300 60"
        className="h-16 w-full overflow-visible"
        role="img"
        aria-label={`Ánimo de los últimos ${dias} días. Promedio ${prom.toFixed(1)} de 5.`}
      >
        <line x1="0" x2="300" y1="30" y2="30" className="stroke-linea" strokeDasharray="3 4" />
        <polyline
          points={puntos.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          className="stroke-azul"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {puntos.map((p) => (
          <circle
            key={p.e.id}
            cx={p.x}
            cy={p.y}
            r="3.5"
            className="fill-papel stroke-azul"
            strokeWidth="2"
          />
        ))}
      </svg>
      <figcaption className="flex justify-between text-xs text-gris">
        <span>Hace {dias} días</span>
        <span>Hoy</span>
      </figcaption>
    </figure>
  )
}

function ModalEscribir({
  open,
  onOpenChange,
  animoInicial,
  rolPro,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  animoInicial: number | null
  rolPro: string
}) {
  const [animo, setAnimo] = useState<number | null>(animoInicial ?? 3)
  const [texto, setTexto] = useState('')
  const [etiquetas, setEtiquetas] = useState<string[]>([])
  const [compartida, setCompartida] = useState(false)
  const [paraSesion, setParaSesion] = useState(false)
  const prompt = useMemo(() => getPromptAleatorio(), [])

  useEffect(() => {
    if (animoInicial) setAnimo(animoInicial)
  }, [animoInicial])

  const toggleEtiqueta = (tag: string) => {
    setEtiquetas((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleGuardar = () => {
    if (!texto.trim() || !animo) return
    const nueva: EntradaDiario = {
      id: Math.random().toString(36).slice(2, 9),
      fecha: new Date().toISOString(),
      texto: texto.trim(),
      animo,
      etiquetas,
      compartida,
      paraSesion,
    }

    updatePanel((p) => ({
      ...p,
      entradas: [nueva, ...p.entradas],
    }))

    toast.success(
      paraSesion ? 'Guardado. Lo sumamos a tu próxima sesión.' : 'Guardado en tu diario.'
    )
    setTexto('')
    setEtiquetas([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Escribir hoy</DialogTitle>
          <DialogDescription>
            Lo que escribas es privado, salvo que decidas compartirlo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Selector de ánimo */}
          <div className="flex items-center justify-between gap-2">
            {CARITAS.map(({ valor, icon: Icon, label }) => {
              const selected = animo === valor
              return (
                <button
                  key={valor}
                  type="button"
                  aria-label={label}
                  onClick={() => setAnimo(valor)}
                  className={`flex size-14 items-center justify-center rounded-full border transition-colors ${
                    selected
                      ? 'border-azul bg-azul text-white'
                      : 'border-linea bg-card text-azul hover:border-azul/50'
                  }`}
                >
                  <Icon className="size-7" strokeWidth={1.5} />
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-2">
            {!texto && <p className="font-semibold text-azul">{prompt}</p>}
            <textarea
              rows={5}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribí como te salga..."
              className="resize-none rounded-2xl border border-azul/30 bg-card p-4 leading-relaxed text-tinta outline-none focus-visible:border-azul"
            />
          </div>

          {/* Etiquetas */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gris">Etiquetas (opcional)</span>
            <div className="flex flex-wrap gap-2">
              {ETIQUETAS_SUGERIDAS.map((tag) => {
                const active = etiquetas.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleEtiqueta(tag)}
                    className={`min-h-10 rounded-full border px-4 text-sm capitalize transition-colors ${
                      active
                        ? 'border-azul bg-azul text-white'
                        : 'border-linea bg-card text-azul hover:border-azul/50'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Controles de compartir */}
          <div className="flex flex-col divide-y divide-linea rounded-2xl border border-linea">
            <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 px-4">
              <span className="flex flex-col">
                <span className="font-medium text-tinta">Compartir con {rolPro}</span>
                <span className="text-xs text-gris">Apagado: solo lo ves vos.</span>
              </span>
              <Switch checked={compartida} onCheckedChange={setCompartida} />
            </label>

            <button
              type="button"
              onClick={() => setParaSesion((prev) => !prev)}
              className="flex min-h-14 items-center justify-between gap-4 px-4 text-left"
            >
              <span className="font-medium text-tinta">
                Quiero hablar de esto en sesión
              </span>
              <Star
                className={`size-6 ${
                  paraSesion ? 'fill-rosa text-rosa' : 'text-gris'
                }`}
              />
            </button>
          </div>

          <Button
            size="lg"
            className="h-14 text-base"
            onClick={handleGuardar}
            disabled={!texto.trim() || !animo}
          >
            {animo ? 'Guardar' : 'Elegí cómo te sentís'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TuSemanaEnPocasLineas({ proNombre, proFecha }: { proNombre: string; proFecha: string }) {
  const sesion = useSesionPaciente()
  const panel = sesion?.panel
  const compartidaPrevia = panel?.semanaCompartida

  const resumenCalculado = useMemo(() => {
    if (!panel) return ''
    const hace7dias = Date.now() - 7 * 86400 * 1000
    const recientes = panel.entradas.filter((e) => new Date(e.fecha).getTime() >= hace7dias)
    const counts = new Map<string, number>()
    recientes.forEach((e) => {
      e.etiquetas.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1))
    })
    const topTags = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t)
    const paraHablar = panel.entradas.filter((e) => e.paraSesion).slice(0, 3)

    return [
      topTags.length
        ? `Esta semana aparecieron sobre todo: ${topTags.join(', ')}.`
        : 'Fue una semana tranquila para escribir.',
      ...paraHablar.map((e) => `Quiero hablar de: ${e.texto}`),
    ].join('\n')
  }, [panel])

  const [texto, setTexto] = useState(compartidaPrevia?.texto ?? resumenCalculado)
  const [editando, setEditando] = useState(!compartidaPrevia)

  const handleCompartir = () => {
    updatePanel((p) => ({
      ...p,
      semanaCompartida: { texto: texto.trim(), fecha: new Date().toISOString() },
    }))
    setEditando(false)
    toast.success(`Se la compartiste a ${proNombre}.`)
  }

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-rosa-claro p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-tinta">Tu semana en pocas líneas</h2>
        <p className="text-sm text-tinta/80 first-letter:uppercase">
          {formatFechaLarga(proFecha)} tenés sesión. Revisalo, cambiá lo que quieras y decidí si se lo compartís.
        </p>
      </div>

      {editando ? (
        <>
          <textarea
            rows={5}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="rounded-2xl border border-azul/20 bg-card p-4 text-base leading-relaxed text-tinta outline-none focus-visible:border-azul"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              className="h-12 flex-1"
              onClick={handleCompartir}
              disabled={!texto.trim()}
            >
              Compartir con {proNombre}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-12"
              onClick={() => setEditando(false)}
            >
              Ahora no
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="whitespace-pre-line leading-relaxed text-tinta">{texto}</p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-tinta/80">
              {compartidaPrevia ? `Compartida con ${proNombre}` : 'No compartida'}
            </span>
            <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
              Editar
            </Button>
          </div>
        </>
      )}
    </section>
  )
}

export default function DiarioPage() {
  const searchParams = useSearchParams()
  const escribirParam = searchParams.get('escribir')
  const valorInicial = escribirParam ? Number(escribirParam) : null
  const [modalAbierto, setModalAbierto] = useState(valorInicial !== null)

  const sesion = useSesionPaciente()
  const panel = sesion?.panel

  if (!panel) return null

  const pro = PROFESIONALES_MOCK.find((p) => p.id === panel.profesionalId) ?? PROFESIONALES_MOCK[0]
  const rolPro = pro.genero === 'mujer' ? 'tu psicóloga' : 'tu psicólogo'

  const proximaSesion = [...panel.sesiones]
    .filter((s) => new Date(s.fecha).getTime() > Date.now())
    .sort((a, b) => a.fecha.localeCompare(b.fecha))[0]

  const mostrarSemana =
    proximaSesion &&
    new Date(proximaSesion.fecha).getTime() - Date.now() < 36 * 3600 * 1000

  const toggleStar = (id: string) => {
    updatePanel((p) => ({
      ...p,
      entradas: p.entradas.map((e) =>
        e.id === id ? { ...e, paraSesion: !e.paraSesion } : e
      ),
    }))
  }

  const toggleCompartir = (id: string) => {
    updatePanel((p) => ({
      ...p,
      entradas: p.entradas.map((e) =>
        e.id === id ? { ...e, compartida: !e.compartida } : e
      ),
    }))
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-azul md:text-4xl">
          Diario
        </h1>
        <Button
          size="lg"
          className="h-14 text-base gap-2"
          onClick={() => setModalAbierto(true)}
        >
          <PenLine className="size-5" />
          Escribir hoy
        </Button>
      </div>

      {mostrarSemana && proximaSesion && (
        <TuSemanaEnPocasLineas
          proFecha={proximaSesion.fecha}
          proNombre={pro.nombre}
        />
      )}

      {/* Gráfico de ánimo */}
      <section className="flex flex-col gap-4 rounded-3xl border border-linea bg-card p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-tinta">Tu ánimo</h2>
          <span className="text-sm text-gris">Últimos 30 días</span>
        </div>
        <GraficoAnimo entradas={panel.entradas} />
      </section>

      {/* Lista de entradas */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-gris">Entradas</h2>
        <ul className="flex flex-col gap-3">
          {panel.entradas.map((e) => {
            const c = CARITAS.find((item) => item.valor === e.animo) ?? CARITAS[2]
            const Icon = c.icon
            return (
              <li
                key={e.id}
                className="flex flex-col gap-3 rounded-3xl border border-linea bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-6 shrink-0 text-azul" strokeWidth={1.5} />
                  <p className="flex-1 text-sm text-gris first-letter:uppercase">
                    {formatFechaLarga(e.fecha)} · {formatHora(e.fecha)}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleStar(e.id)}
                    aria-label="Quiero hablar de esto en sesión"
                    className="flex size-10 items-center justify-center rounded-full hover:bg-muted"
                  >
                    <Star
                      className={`size-5 ${
                        e.paraSesion ? 'fill-rosa text-rosa' : 'text-gris'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-pretty leading-relaxed text-tinta">{e.texto}</p>

                <div className="flex flex-wrap items-center gap-2">
                  {e.etiquetas.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-muted px-3 py-1 text-xs capitalize text-tinta"
                    >
                      {t}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => toggleCompartir(e.id)}
                    className={`ml-auto flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
                      e.compartida
                        ? 'bg-azul/10 text-azul'
                        : 'text-gris hover:bg-muted'
                    }`}
                  >
                    {e.compartida ? (
                      <Users className="size-3.5" />
                    ) : (
                      <Lock className="size-3.5" />
                    )}
                    {e.compartida ? `Compartida con ${rolPro}` : 'Solo vos'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <ModalEscribir
        open={modalAbierto}
        onOpenChange={setModalAbierto}
        animoInicial={valorInicial}
        rolPro={rolPro}
      />
    </>
  )
}
