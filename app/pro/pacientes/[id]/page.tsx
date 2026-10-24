'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  FileText,
  HeartPulse,
  ListChecks,
  MessageCircle,
  Plus,
  Sparkles,
  UserRound,
  Video,
  MapPin,
  Wallet,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  useDemoProfesional,
  guardarDemoProfesional,
  formatHora,
  formatFechaCorta,
  formatFechaLarga,
  formatDiaSemana,
  formatPesos,
  formatTiempoRelativo,
  nombreCompleto,
  iniciales,
  calcularEdad,
  NotaClinica,
} from '@/lib/puente-pro-demo'
import { useAsistenteContext } from '../../layout'

const EMOJIS_ANIMO = [
  { valor: 1, emoji: '😣', label: 'Muy mal' },
  { valor: 2, emoji: '😕', label: 'Mal' },
  { valor: 3, emoji: '😐', label: 'Más o menos' },
  { valor: 4, emoji: '🙂', label: 'Bien' },
  { valor: 5, emoji: '😄', label: 'Muy bien' },
]

export default function FichaPacientePage() {
  const params = useParams()
  const pacienteId = params?.id as string

  const estadoPro = useDemoProfesional()
  const { abrir: abrirAsistente } = useAsistenteContext()

  const [textoNota, setTextoNota] = useState('')
  const [resumenSugerido, setResumenSugerido] = useState<string | null>(null)
  const [resumiendo, setResumiendo] = useState(false)
  const [guardandoNota, setGuardandoNota] = useState(false)
  const [nuevaTarea, setNuevaTarea] = useState('')

  const paciente = estadoPro.pacientes.find((p) => p.id === pacienteId)

  if (!paciente) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <UserRound className="size-12 opacity-40 text-muted-foreground" />
        <p className="text-lg font-semibold text-foreground">No encontramos este paciente</p>
        <Link href="/pro/pacientes" className={buttonVariants({ variant: 'outline' })}>
          Volver a pacientes
        </Link>
      </div>
    )
  }

  const nombre = nombreCompleto(paciente)
  const edad = calcularEdad(paciente.fechaNacimiento)

  const turnosPac = estadoPro.turnos.filter((t) => t.pacienteId === paciente.id)
  const proximoTurno = turnosPac
    .filter((t) => new Date(t.inicio).getTime() >= Date.now() && t.estado !== 'cancelado')
    .sort((a, b) => a.inicio.localeCompare(b.inicio))[0]

  const sesionesRealizadas = turnosPac.filter((t) => t.estado === 'realizado')
  const ultimaSesion = sesionesRealizadas.sort((a, b) => b.inicio.localeCompare(a.inicio))[0]

  const notasPac = estadoPro.notas
    .filter((n) => n.pacienteId === paciente.id)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  const animosPac = estadoPro.animos
    .filter((a) => a.pacienteId === paciente.id)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const tareasPac = estadoPro.tareas.filter((tk) => tk.pacienteId === paciente.id)
  const pagosPac = estadoPro.pagos.filter((pg) => pg.pacienteId === paciente.id)
  const deuda = pagosPac
    .filter((pg) => pg.estado === 'pendiente')
    .reduce((acc, pg) => acc + pg.monto, 0)

  const linkWhatsapp = `https://wa.me/${paciente.telefono.replace(/\D/g, '')}`

  const handleResumirConIA = async () => {
    if (!textoNota.trim()) return
    setResumiendo(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      setResumenSugerido(
        `Se trabajó sobre la temática central. Se aplicaron técnicas de regulación y se acordaron compromisos para la semana.`
      )
    } finally {
      setResumiendo(false)
    }
  }

  const handleGuardarNota = async () => {
    if (!textoNota.trim()) return
    setGuardandoNota(true)
    try {
      const nuevaNota: NotaClinica = {
        id: `np_${Date.now()}`,
        pacienteId: paciente.id,
        fecha: new Date().toISOString(),
        texto: textoNota.trim(),
        etiquetas: ['seguimiento'],
        resumenIA: resumenSugerido ?? undefined,
      }

      guardarDemoProfesional({
        ...estadoPro,
        notas: [nuevaNota, ...estadoPro.notas],
      })
      setTextoNota('')
      setResumenSugerido(null)
      toast.success('Nota guardada')
    } finally {
      setGuardandoNota(false)
    }
  }

  const handleToggleTarea = (tareaId: string) => {
    guardarDemoProfesional({
      ...estadoPro,
      tareas: estadoPro.tareas.map((tk) =>
        tk.id === tareaId ? { ...tk, hecha: !tk.hecha } : tk
      ),
    })
  }

  const handleAgregarTarea = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = nuevaTarea.trim()
    if (!clean) return

    guardarDemoProfesional({
      ...estadoPro,
      tareas: [
        ...estadoPro.tareas,
        {
          id: `tk_${Date.now()}`,
          pacienteId: paciente.id,
          titulo: clean,
          hecha: false,
        },
      ],
    })
    setNuevaTarea('')
  }

  return (
    <>
      <Link
        href="/pro/pacientes"
        className="-mb-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-azul hover:underline"
      >
        <ArrowLeft className="size-4" />
        Pacientes
      </Link>

      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-secondary font-heading font-semibold text-xl text-secondary-foreground">
            {iniciales(paciente)}
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-tinta md:text-3xl">
              {nombre}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize text-secondary-foreground">
                {paciente.estado}
              </span>
              <span>{edad} años</span>
              <span>{paciente.obraSocial}</span>
              <span className="flex items-center gap-1">
                {paciente.modalidad === 'virtual' ? <Video className="size-3" /> : <MapPin className="size-3" />}
                {paciente.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => abrirAsistente(`¿Cómo viene ${paciente.nombre}?`)}
          >
            <Sparkles className="size-4" />
            Preparar sesión
          </Button>
          <a
            href={linkWhatsapp}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: 'outline', className: 'gap-2' })}
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
        </div>
      </header>

      {/* 4 Métricas clave */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border ring-1 ring-border lg:grid-cols-4">
        <div className="flex flex-col gap-1 bg-card p-4">
          <dt className="text-xs text-muted-foreground">Próxima sesión</dt>
          <dd className="font-heading text-base font-semibold text-tinta tabular-nums">
            {proximoTurno
              ? `${formatDiaSemana(proximoTurno.inicio)} ${formatFechaCorta(
                  proximoTurno.inicio
                )} · ${formatHora(proximoTurno.inicio)}`
              : 'Sin turno'}
          </dd>
        </div>
        <div className="flex flex-col gap-1 bg-card p-4">
          <dt className="text-xs text-muted-foreground">Última sesión</dt>
          <dd className="font-heading text-base font-semibold text-tinta tabular-nums">
            {ultimaSesion ? formatTiempoRelativo(ultimaSesion.inicio) : 'Todavía no'}
          </dd>
        </div>
        <div className="flex flex-col gap-1 bg-card p-4">
          <dt className="text-xs text-muted-foreground">Sesiones</dt>
          <dd className="font-heading text-base font-semibold text-tinta tabular-nums">
            {sesionesRealizadas.length} · {paciente.frecuencia.toLowerCase()}
          </dd>
        </div>
        <div className="flex flex-col gap-1 bg-card p-4">
          <dt className="text-xs text-muted-foreground">Saldo</dt>
          <dd
            className={`font-heading text-base font-semibold tabular-nums ${
              deuda > 0 ? 'text-rosa' : 'text-tinta'
            }`}
          >
            {deuda > 0 ? formatPesos(deuda) : 'Al día'}
          </dd>
        </div>
      </dl>

      {/* Grid en 2 columnas */}
      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        {/* Columna izquierda */}
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          {/* Motivo de consulta */}
          <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
              <FileText className="size-4 text-primary" />
              Motivo de consulta
            </h2>
            <p className="text-pretty leading-relaxed text-tinta">{paciente.motivoConsulta}</p>

            {paciente.resumenInicial && (
              <details className="group rounded-xl bg-secondary/60 p-4">
                <summary className="cursor-pointer text-sm font-medium text-azul">
                  Resumen que aprobó en la primera charla
                </summary>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-tinta">
                  {paciente.resumenInicial.texto}
                </p>
              </details>
            )}
          </section>

          {/* Notas de sesión */}
          <section className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
              <FileText className="size-4 text-primary" />
              Notas de sesión
            </h2>

            <div className="flex flex-col gap-3 rounded-xl bg-muted p-3">
              <label htmlFor="nota-input" className="sr-only">
                Nota de la sesión
              </label>
              <textarea
                id="nota-input"
                rows={3}
                value={textoNota}
                onChange={(e) => {
                  setTextoNota(e.target.value)
                  setResumenSugerido(null)
                }}
                placeholder="Qué se trabajó hoy. Ej.: Revisamos el registro de pensamientos. Acordamos practicar respiración antes de dormir."
                className="min-h-24 w-full resize-y rounded-lg border border-input bg-card px-3.5 py-2.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />

              {resumenSugerido && (
                <div className="flex flex-col gap-2 rounded-lg bg-card p-3 text-sm ring-1 ring-rosa/30">
                  <p className="flex items-center gap-1.5 font-medium text-rosa">
                    <Sparkles className="size-3.5" />
                    Resumen sugerido
                  </p>
                  <p className="text-tinta">{resumenSugerido}</p>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  disabled={!textoNota.trim() || resumiendo}
                  onClick={handleResumirConIA}
                >
                  <Sparkles className="size-3.5" />
                  {resumiendo ? 'Resumiendo…' : 'Resumir con IA'}
                </Button>
                <Button
                  size="sm"
                  disabled={!textoNota.trim() || guardandoNota}
                  onClick={handleGuardarNota}
                >
                  {guardandoNota ? 'Guardando…' : 'Guardar nota'}
                </Button>
              </div>
            </div>

            <ol className="flex flex-col">
              {notasPac.map((n) => (
                <li
                  key={n.id}
                  className="flex flex-col gap-2 border-t border-border py-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <time dateTime={n.fecha} className="text-sm font-semibold text-tinta">
                      {formatDiaSemana(n.fecha)} {formatFechaCorta(n.fecha)}
                    </time>
                    {n.etiquetas.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground capitalize"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {n.resumenIA ? (
                    <>
                      <p className="text-pretty leading-relaxed text-tinta">{n.resumenIA}</p>
                      <details>
                        <summary className="cursor-pointer text-xs text-azul">Ver nota completa</summary>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                          {n.texto}
                        </p>
                      </details>
                    </>
                  ) : (
                    <p className="text-pretty leading-relaxed text-tinta whitespace-pre-line">
                      {n.texto}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Columna derecha */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* Ánimo registrado */}
          <section className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
              <HeartPulse className="size-4 text-primary" />
              Ánimo registrado
            </h2>

            {animosPac.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no registró su ánimo en la app.
              </p>
            ) : (
              <div className="flex h-36 items-end gap-1.5 pt-2">
                {animosPac.slice(-14).map((a) => {
                  const itemEmoji = EMOJIS_ANIMO.find((e) => e.valor === a.valor)
                  return (
                    <div key={a.id} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                      <span className="text-xs">{itemEmoji?.emoji}</span>
                      <div
                        className={`w-full max-w-6 rounded-md ${
                          a.valor >= 4
                            ? 'bg-primary'
                            : a.valor === 3
                            ? 'bg-accent'
                            : 'bg-rosa'
                        }`}
                        style={{ height: `${(a.valor / 5) * 80}%` }}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Tareas */}
          <section className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
                <ListChecks className="size-4 text-primary" />
                Tareas
              </h2>
              {tareasPac.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {tareasPac.filter((t) => t.hecha).length}/{tareasPac.length}
                </span>
              )}
            </div>

            <ul className="flex flex-col gap-1">
              {tareasPac.map((tk) => (
                <li key={tk.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-1.5 hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={tk.hecha}
                      onChange={() => handleToggleTarea(tk.id)}
                      className="mt-0.5 size-4 accent-[var(--azul)]"
                    />
                    <span
                      className={`text-sm leading-snug ${
                        tk.hecha ? 'text-muted-foreground line-through' : 'text-tinta'
                      }`}
                    >
                      {tk.titulo}
                    </span>
                  </label>
                </li>
              ))}
            </ul>

            <form onSubmit={handleAgregarTarea} className="flex gap-2">
              <input
                value={nuevaTarea}
                onChange={(e) => setNuevaTarea(e.target.value)}
                placeholder="Nueva tarea para la semana"
                className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button type="submit" size="icon-sm" variant="outline" disabled={!nuevaTarea.trim()}>
                <Plus className="size-4" />
              </Button>
            </form>
          </section>

          {/* Pagos */}
          <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
                <Wallet className="size-4 text-primary" />
                Pagos
              </h2>
              <Link href="/pro/cobros" className="text-xs text-azul hover:underline">
                Ir a cobros
              </Link>
            </div>

            {deuda > 0 && (
              <p className="rounded-xl bg-rosa-claro/70 px-3.5 py-2.5 text-sm text-tinta">
                Debe <span className="font-semibold text-rosa tabular-nums">{formatPesos(deuda)}</span>
              </p>
            )}

            <ul className="flex flex-col divide-y divide-border">
              {pagosPac.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-tinta">{p.concepto}</span>
                    <span className="text-xs text-muted-foreground capitalize">{p.metodo}</span>
                  </div>
                  <span
                    className={`font-semibold tabular-nums ${
                      p.estado === 'pendiente' ? 'text-rosa' : 'text-tinta'
                    }`}
                  >
                    {formatPesos(p.monto)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Contacto */}
          <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
              <UserRound className="size-4 text-primary" />
              Contacto
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Teléfono</dt>
              <dd className="text-tinta tabular-nums">{paciente.telefono}</dd>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="truncate text-tinta">{paciente.email}</dd>
              <dt className="text-muted-foreground">Honorario</dt>
              <dd className="text-tinta tabular-nums">{formatPesos(paciente.honorario)}</dd>
              <dt className="text-muted-foreground">En terapia desde</dt>
              <dd className="text-tinta">{formatFechaCorta(paciente.inicio, { month: 'long', year: 'numeric' })}</dd>
            </dl>
          </section>
        </div>
      </div>
    </>
  )
}
