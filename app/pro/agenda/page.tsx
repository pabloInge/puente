'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  MapPin,
  Check,
  CheckCircle2,
  X,
  CalendarX2,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  useDemoProfesional,
  guardarDemoProfesional,
  inicioDeSemana,
  sumarDias,
  mismoDia,
  formatHora,
  formatFechaCorta,
  formatFechaLarga,
  formatDiaSemana,
  nombreCompleto,
  iniciales,
  Turno,
} from '@/lib/puente-pro-demo'

const HORA_INICIO = 8
const HORA_FIN = 21
const ALTURA_HORA = 56

const ESTILOS_TURNO: Record<Turno['estado'], string> = {
  confirmado: 'bg-primary text-primary-foreground hover:bg-primary/90',
  pendiente: 'bg-warning-soft text-foreground ring-1 ring-warning/40 hover:bg-warning-soft/80',
  realizado: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  cancelado: 'bg-muted text-muted-foreground line-through hover:bg-muted/80',
}

function ModalDetalleTurno({
  turno,
  onOpenChange,
}: {
  turno: Turno | null
  onOpenChange: (open: boolean) => void
}) {
  const estadoPro = useDemoProfesional()
  if (!turno) return null

  const handleEstado = (nuevoEstado: Turno['estado'], mensaje: string) => {
    guardarDemoProfesional({
      ...estadoPro,
      turnos: estadoPro.turnos.map((t) =>
        t.id === turno.id ? { ...t, estado: nuevoEstado } : t
      ),
    })
    toast.success(mensaje)
    onOpenChange(false)
  }

  const esModificable = turno.estado !== 'cancelado' && turno.estado !== 'realizado'

  return (
    <Dialog open={!!turno} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-secondary font-heading font-semibold text-sm text-secondary-foreground">
              {iniciales(turno.paciente)}
            </span>
            <div className="flex flex-col gap-0.5">
              <DialogTitle>{nombreCompleto(turno.paciente)}</DialogTitle>
              <DialogDescription>{formatFechaLarga(turno.inicio)} · {formatHora(turno.inicio)} hs</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-secondary px-2.5 py-1 font-medium capitalize text-secondary-foreground">
            {turno.estado}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {turno.modalidad === 'virtual' ? <Video className="size-4" /> : <MapPin className="size-4" />}
            {turno.modalidad === 'virtual' ? 'Virtual' : 'Presencial'} · {turno.duracionMin} min
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 pt-2">
          {turno.estado === 'pendiente' && (
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => handleEstado('confirmado', 'Turno confirmado')}
            >
              <Check className="size-4" />
              Confirmar
            </Button>
          )}

          {esModificable && turno.modalidad === 'virtual' && (
            <a
              href={`https://meet.jit.si/puente-${turno.id}`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: 'secondary', className: 'gap-2' })}
            >
              <Video className="size-4" />
              Iniciar videollamada
            </a>
          )}

          {esModificable && (
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => handleEstado('realizado', 'Sesión realizada')}
            >
              <CheckCircle2 className="size-4" />
              Marcar realizada
            </Button>
          )}

          {esModificable && (
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => handleEstado('cancelado', 'Turno cancelado')}
            >
              <X className="size-4" />
              Cancelar turno
            </Button>
          )}

          <Link
            href={`/pro/pacientes/${turno.pacienteId}`}
            className={buttonVariants({ variant: 'outline' })}
            onClick={() => onOpenChange(false)}
          >
            Ver ficha completa
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AgendaPage() {
  const estadoPro = useDemoProfesional()
  const [lunesActual, setLunesActual] = useState(() => inicioDeSemana(new Date()))
  const [diaSeleccionadoMobile, setDiaSeleccionadoMobile] = useState(() => new Date())
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null)

  const diasSemana = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => sumarDias(lunesActual, i))
  }, [lunesActual])

  const horas = useMemo(() => {
    return Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i)
  }, [])

  const navegarSemana = (dir: number) => {
    const nuevoLunes = sumarDias(lunesActual, dir * 7)
    setLunesActual(nuevoLunes)
    setDiaSeleccionadoMobile(nuevoLunes)
  }

  const irAHoy = () => {
    const hoy = new Date()
    setLunesActual(inicioDeSemana(hoy))
    setDiaSeleccionadoMobile(hoy)
  }

  const turnosSemana = estadoPro.turnos

  const domingoSemana = sumarDias(lunesActual, 6)
  const rangoTexto = `${lunesActual.getDate()} al ${domingoSemana.getDate()} de ${domingoSemana.toLocaleDateString(
    'es-AR',
    { month: 'long' }
  )}`

  const turnosDiaMobile = turnosSemana.filter((t) => mismoDia(t.inicio, diaSeleccionadoMobile))

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Agenda
          </h1>
          <p className="text-sm text-muted-foreground">Semana del {rangoTexto}</p>
        </div>
      </header>

      {/* Controles de semana */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => navegarSemana(-1)} aria-label="Semana anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navegarSemana(1)} aria-label="Semana siguiente">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" onClick={irAHoy}>
            Hoy
          </Button>
        </div>

        <ul className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex" aria-label="Referencias">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary" />
            Confirmado
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-warning-soft ring-1 ring-warning/40" />
            Pendiente
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-secondary" />
            Realizado
          </li>
        </ul>
      </div>

      {/* Grid semanal desktop */}
      <div className="hidden overflow-hidden rounded-2xl bg-card ring-1 ring-border md:block">
        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-border">
          <span />
          {diasSemana.map((d) => {
            const esHoy = mismoDia(d, new Date())
            return (
              <div
                key={d.toISOString()}
                className="flex flex-col items-center gap-0.5 border-l border-border py-2.5"
              >
                <span className="text-xs capitalize text-muted-foreground">
                  {formatDiaSemana(d)}
                </span>
                <span
                  className={`flex size-8 items-center justify-center rounded-full font-heading text-sm font-semibold tabular-nums ${
                    esHoy ? 'bg-primary text-primary-foreground' : 'text-foreground'
                  }`}
                >
                  {d.getDate()}
                </span>
              </div>
            )
          })}
        </div>

        <div className="max-h-[calc(100dvh-17rem)] overflow-y-auto">
          <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
            {/* Columna de horas */}
            <div>
              {horas.map((h) => (
                <div
                  key={h}
                  className="relative pr-2 text-right text-xs tabular-nums text-muted-foreground"
                  style={{ height: ALTURA_HORA }}
                >
                  <span className="relative -top-2">{h}:00</span>
                </div>
              ))}
            </div>

            {/* Columnas de días */}
            {diasSemana.map((dia) => {
              const turnosDelDia = turnosSemana.filter((t) => mismoDia(t.inicio, dia))
              return (
                <div key={dia.toISOString()} className="relative border-l border-border">
                  {horas.map((h) => (
                    <div
                      key={h}
                      className="border-t border-border/70 first:border-t-0"
                      style={{ height: ALTURA_HORA }}
                    />
                  ))}

                  {turnosDelDia.map((t) => {
                    const dInicio = new Date(t.inicio)
                    const top =
                      (dInicio.getHours() - HORA_INICIO + dInicio.getMinutes() / 60) * ALTURA_HORA
                    const altura = Math.max((t.duracionMin / 60) * ALTURA_HORA - 4, 28)

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTurnoSeleccionado(t)}
                        className={`absolute inset-x-1 flex flex-col overflow-hidden rounded-lg px-2 py-1 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          ESTILOS_TURNO[t.estado]
                        }`}
                        style={{ top: top + 2, height: altura }}
                      >
                        <span className="truncate font-semibold">
                          {t.paciente.nombre} {t.paciente.apellido.charAt(0)}.
                        </span>
                        <span className="truncate tabular-nums opacity-80">
                          {formatHora(t.inicio)} ·{' '}
                          {t.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Vista móvil diaria */}
      <div className="flex flex-col gap-4 md:hidden">
        {/* Selector de días horizontal */}
        <div className="grid grid-cols-7 gap-1" role="tablist">
          {diasSemana.map((d) => {
            const activo = mismoDia(d, diaSeleccionadoMobile)
            const count = turnosSemana.filter(
              (t) => mismoDia(t.inicio, d) && t.estado !== 'cancelado'
            ).length
            return (
              <button
                key={d.toISOString()}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => setDiaSeleccionadoMobile(d)}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
                  activo
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground ring-1 ring-border'
                }`}
              >
                <span className={`text-[11px] capitalize ${activo ? 'opacity-80' : 'text-muted-foreground'}`}>
                  {formatDiaSemana(d)}
                </span>
                <span className="font-heading text-base font-semibold tabular-nums">
                  {d.getDate()}
                </span>
                <span className="flex h-1.5 gap-0.5">
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <span
                      key={i}
                      className={`size-1.5 rounded-full ${
                        activo ? 'bg-primary-foreground' : 'bg-primary'
                      }`}
                    />
                  ))}
                </span>
              </button>
            )
          })}
        </div>

        {/* Turnos del día en móvil */}
        {turnosDiaMobile.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-10 text-center text-muted-foreground">
            <CalendarX2 className="size-8 opacity-40" />
            <p className="font-medium text-foreground">Día libre</p>
            <p className="text-sm">No tenés sesiones este día.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {turnosDiaMobile.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setTurnoSeleccionado(t)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-card p-3.5 text-left ring-1 ring-border transition-colors hover:bg-muted/50"
                >
                  <span className="w-12 shrink-0 font-heading text-sm font-semibold tabular-nums text-foreground">
                    {formatHora(t.inicio)}
                  </span>
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-secondary font-heading font-semibold text-xs text-secondary-foreground">
                    {iniciales(t.paciente)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-foreground">
                      {nombreCompleto(t.paciente)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t.modalidad === 'virtual' ? 'Virtual' : 'Presencial'} · {t.duracionMin} min
                    </span>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize text-secondary-foreground">
                    {t.estado}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ModalDetalleTurno
        turno={turnoSeleccionado}
        onOpenChange={(open) => !open && setTurnoSeleccionado(null)}
      />
    </>
  )
}
