'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  Clock,
  FilePenLine,
  MapPin,
  Plus,
  Star,
  Sun,
  Video,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  useDemoProfesional,
  guardarDemoProfesional,
  mismoDia,
  inicioDelDia,
  formatHora,
  formatFechaCorta,
  formatFechaLarga,
  formatDiaSemana,
  formatPesos,
  saludoSegunHora,
  nombreCompleto,
  iniciales,
  Turno,
} from '@/lib/puente-pro-demo'
import { useSesionPaciente, updatePanel } from '@/lib/puente-demo'

function ModalNuevoTurno({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const estadoPro = useDemoProfesional()
  const pacientesActivos = estadoPro.pacientes.filter((p) => p.estado === 'activo')

  const [pacienteId, setPacienteId] = useState(pacientesActivos[0]?.id ?? '')
  const [fecha, setFecha] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  })
  const [hora, setHora] = useState('10:00')
  const [modalidad, setModalidad] = useState<'virtual' | 'presencial'>('virtual')
  const [pendiente, setPendiente] = useState(false)

  const handleAgendar = (e: React.FormEvent) => {
    e.preventDefault()
    const pac = estadoPro.pacientes.find((p) => p.id === pacienteId)
    if (!pac) return

    const [h, m] = hora.split(':').map(Number)
    const [y, mon, day] = fecha.split('-').map(Number)
    const inicio = new Date(y, mon - 1, day, h, m, 0, 0).toISOString()

    const nuevoTurno: Turno = {
      id: `t_${Date.now()}`,
      pacienteId: pac.id,
      inicio,
      duracionMin: 50,
      modalidad,
      estado: pendiente ? 'pendiente' : 'confirmado',
      paciente: {
        id: pac.id,
        nombre: pac.nombre,
        apellido: pac.apellido,
      },
    }

    guardarDemoProfesional({
      ...estadoPro,
      turnos: [...estadoPro.turnos, nuevoTurno],
    })

    toast.success('Turno agendado', {
      description: `${nombreCompleto(pac)} · ${formatFechaLarga(inicio)} · ${hora} h`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo turno</DialogTitle>
          <DialogDescription>
            Queda confirmado en tu agenda y el paciente lo ve en su portal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAgendar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nt-paciente" className="text-sm font-medium text-foreground">
              Paciente
            </label>
            <select
              id="nt-paciente"
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-[15px] outline-none focus-visible:border-ring"
              required
            >
              {pacientesActivos.map((p) => (
                <option key={p.id} value={p.id}>
                  {nombreCompleto(p)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nt-fecha" className="text-sm font-medium text-foreground">
                Fecha
              </label>
              <input
                id="nt-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="h-11 rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus-visible:border-ring"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nt-hora" className="text-sm font-medium text-foreground">
                Hora
              </label>
              <input
                id="nt-hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="h-11 rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus-visible:border-ring"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Modalidad</span>
            <div className="grid grid-cols-2 gap-2">
              {(['virtual', 'presencial'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModalidad(m)}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors ${
                    modalidad === m
                      ? 'border-primary bg-secondary text-secondary-foreground'
                      : 'border-input text-foreground hover:bg-muted'
                  }`}
                >
                  {m === 'virtual' ? <Video className="size-4" /> : <MapPin className="size-4" />}
                  {m === 'virtual' ? 'Virtual' : 'Presencial'}
                </button>
              ))}
            </div>
          </div>

          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl bg-muted px-3.5 text-sm">
            <input
              type="checkbox"
              checked={pendiente}
              onChange={(e) => setPendiente(e.target.checked)}
              className="size-4 accent-primary"
            />
            Dejar sin confirmar (le pedimos al paciente que lo confirme)
          </label>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Agendar turno</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DerivacionPendienteCard() {
  const sesion = useSesionPaciente()
  const derivacion = sesion?.panel?.derivacion
  const [modalOpen, setModalOpen] = useState(false)
  const [texto, setTexto] = useState(
    'Temas trabajados:\n\nEnfoque usado:\n\nSugerencias para quien continúe:\n'
  )

  if (!derivacion || derivacion.estado !== 'pedida') return null
  const nombrePaciente = sesion.contacto?.nombre ?? 'Tu paciente'

  const handleAprobar = () => {
    updatePanel((p) => ({
      ...p,
      derivacion: {
        ...p.derivacion,
        estado: 'aprobada',
        texto: texto.trim(),
      },
    }))
    setModalOpen(false)
    toast.success(`Nota de derivación enviada a ${nombrePaciente}.`)
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-rosa/40 bg-rosa-claro p-4">
      <div className="flex items-start gap-3">
        <FilePenLine className="mt-0.5 size-5 shrink-0 text-azul" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-tinta">
            {nombrePaciente} pidió una nota de derivación
          </h2>
          <p className="text-sm leading-relaxed text-tinta/80">
            Un texto breve para quien continúe. Tus notas privadas no se incluyen.
          </p>
        </div>
      </div>
      <Button className="self-start" onClick={() => setModalOpen(true)}>
        Escribir nota
      </Button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nota de derivación para {nombrePaciente}</DialogTitle>
            <DialogDescription>
              Se envía solo cuando la apruebes. Ella decide si la incluye en su informe.
            </DialogDescription>
          </DialogHeader>

          <textarea
            rows={8}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full resize-none rounded-xl border border-input bg-card p-3 text-sm leading-relaxed text-tinta outline-none focus-visible:border-azul"
          />

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAprobar}>Aprobar y enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function CompartidoPorPacienteCard() {
  const sesion = useSesionPaciente()
  const panel = sesion?.panel
  if (!panel) return null

  const entradasCompartidas = panel.entradas
    .filter((e) => e.compartida)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
  const paraSesion = panel.entradas.filter((e) => e.paraSesion && e.compartida)

  if (!entradasCompartidas.length && !panel.semanaCompartida) return null
  const nombre = sesion.contacto?.nombre ?? 'Tu paciente'

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-semibold text-tinta">Lo que compartió {nombre}</h2>
        <p className="text-xs text-gris">Solo lectura. No ves lo que no compartió.</p>
      </div>

      {panel.semanaCompartida && (
        <div className="flex flex-col gap-1 rounded-xl bg-muted/60 p-3">
          <span className="text-xs font-medium text-gris">Su semana en pocas líneas</span>
          <p className="whitespace-pre-line text-sm leading-relaxed text-tinta">
            {panel.semanaCompartida.texto}
          </p>
        </div>
      )}

      {paraSesion.length > 0 && (
        <p className="text-sm font-medium text-tinta">
          {paraSesion.length} {paraSesion.length === 1 ? 'tema' : 'temas'} para la próxima sesión
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {entradasCompartidas.slice(0, 3).map((e) => (
          <li key={e.id} className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 text-xs text-gris">
              {formatFechaCorta(e.fecha)}
              {e.paraSesion && (
                <Star className="size-3 fill-rosa text-rosa" aria-label="Quiere hablarlo en sesión" />
              )}
            </span>
            <p className="line-clamp-2 text-sm leading-relaxed text-tinta">{e.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function ProDashboardPage() {
  const estadoPro = useDemoProfesional()
  const [modalNuevoTurno, setModalNuevoTurno] = useState(false)

  const hoy = new Date()
  const turnosHoy = estadoPro.turnos
    .filter((t) => mismoDia(t.inicio, hoy) && t.estado !== 'cancelado')
    .sort((a, b) => a.inicio.localeCompare(b.inicio))

  const turnosSinConfirmar = estadoPro.turnos.filter(
    (t) => t.estado === 'pendiente' && new Date(t.inicio).getTime() >= inicioDelDia(hoy).getTime()
  )

  const proximosTurnos = estadoPro.turnos
    .filter(
      (t) =>
        new Date(t.inicio).getTime() > hoy.getTime() &&
        !mismoDia(t.inicio, hoy) &&
        t.estado !== 'cancelado'
    )
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
    .slice(0, 5)

  const realizadasHoy = turnosHoy.filter((t) => t.estado === 'realizado').length
  const pacientesActivos = estadoPro.pacientes.filter((p) => p.estado === 'activo').length

  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).getTime()
  const cobradoMes = estadoPro.pagos
    .filter((p) => p.estado === 'pagado' && new Date(p.fecha).getTime() >= inicioMes)
    .reduce((acc, p) => acc + p.monto, 0)

  const pendienteCobro = estadoPro.pagos
    .filter((p) => p.estado === 'pendiente')
    .reduce((acc, p) => acc + p.monto, 0)

  const handleMarcarRealizado = (turnoId: string) => {
    guardarDemoProfesional({
      ...estadoPro,
      turnos: estadoPro.turnos.map((t) =>
        t.id === turnoId ? { ...t, estado: 'realizado' } : t
      ),
    })
    toast.success('Sesión marcada como realizada', {
      description: 'Sumamos el cobro pendiente.',
    })
  }

  const handleConfirmarTurno = (turnoId: string) => {
    guardarDemoProfesional({
      ...estadoPro,
      turnos: estadoPro.turnos.map((t) =>
        t.id === turnoId ? { ...t, estado: 'confirmado' } : t
      ),
    })
    toast.success('Turno confirmado')
  }

  return (
    <>
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-balance font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {saludoSegunHora()}, {estadoPro.profesional.nombre}
          </h1>
          <p className="text-sm text-muted-foreground first-letter:uppercase">
            {formatFechaLarga(hoy)}
          </p>
        </div>

        <Button onClick={() => setModalNuevoTurno(true)} className="gap-2">
          <Plus className="size-4" />
          Nuevo turno
        </Button>
      </header>

      {/* Métricas clave */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5 rounded-2xl bg-card p-4 ring-1 ring-border md:p-5">
          <span className="text-sm text-muted-foreground">Sesiones hoy</span>
          <span className="font-heading text-2xl font-semibold tabular-nums text-foreground md:text-3xl">
            {turnosHoy.length}
          </span>
          <span className="text-xs text-muted-foreground">
            {realizadasHoy} realizadas
          </span>
        </div>

        <Link
          href="/pro/pacientes"
          className="group flex flex-col gap-1.5 rounded-2xl bg-card p-4 ring-1 ring-border transition-colors hover:ring-primary/40 md:p-5"
        >
          <span className="flex items-center justify-between text-sm text-muted-foreground">
            Pacientes activos
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
          <span className="font-heading text-2xl font-semibold tabular-nums text-foreground md:text-3xl">
            {pacientesActivos}
          </span>
        </Link>

        <div className="flex flex-col gap-1.5 rounded-2xl bg-card p-4 ring-1 ring-border md:p-5">
          <span className="text-sm text-muted-foreground">Cobrado este mes</span>
          <span className="font-heading text-2xl font-semibold tabular-nums text-foreground md:text-3xl">
            {formatPesos(cobradoMes)}
          </span>
        </div>

        <Link
          href="/pro/cobros"
          className="group flex flex-col gap-1.5 rounded-2xl bg-card p-4 ring-1 ring-border transition-colors hover:ring-primary/40 md:p-5"
        >
          <span className="flex items-center justify-between text-sm text-muted-foreground">
            Por cobrar
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
          <span className="font-heading text-2xl font-semibold tabular-nums text-rosa md:text-3xl">
            {formatPesos(pendienteCobro)}
          </span>
        </Link>
      </div>

      {/* Grid principal */}
      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        {/* Tu día */}
        <section className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border lg:col-span-2">
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
            <Sun className="size-4 text-primary" />
            Tu día
          </h2>

          {turnosHoy.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <CalendarDays className="size-8 opacity-40" />
              <p className="font-medium text-foreground">Hoy no tenés sesiones</p>
              <p className="text-sm">Aprovechá para ponerte al día con notas o descansar un rato.</p>
            </div>
          ) : (
            <ol className="flex flex-col divide-y divide-border">
              {turnosHoy.map((t) => {
                const realizado = t.estado === 'realizado'
                return (
                  <li key={t.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-12 font-heading text-sm font-semibold tabular-nums text-foreground">
                        {formatHora(t.inicio)}
                      </span>
                      <span className="inline-flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {iniciales(t.paciente)}
                      </span>
                      <div className="flex flex-col">
                        <Link
                          href={`/pro/pacientes/${t.pacienteId}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {nombreCompleto(t.paciente)}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {t.modalidad === 'virtual' ? 'Virtual' : 'Presencial'} · {t.duracionMin} min
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {realizado ? (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                          Realizada
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1.5"
                          onClick={() => handleMarcarRealizado(t.id)}
                        >
                          <CheckCircle2 className="size-3.5" />
                          Marcar realizada
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        {/* Columna lateral derecha */}
        <div className="flex flex-col gap-4">
          <DerivacionPendienteCard />
          <CompartidoPorPacienteCard />

          {/* Turnos sin confirmar */}
          {turnosSinConfirmar.length > 0 && (
            <section className="flex flex-col gap-3 rounded-2xl bg-warning-soft p-5 ring-1 ring-warning/20">
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
                <Clock className="size-4 text-warning" />
                {turnosSinConfirmar.length === 1
                  ? '1 turno sin confirmar'
                  : `${turnosSinConfirmar.length} turnos sin confirmar`}
              </h2>
              <ul className="flex flex-col gap-2">
                {turnosSinConfirmar.slice(0, 4).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-card p-3 ring-1 ring-border"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {nombreCompleto(t.paciente)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDiaSemana(t.inicio)} {formatFechaCorta(t.inicio)} · {formatHora(t.inicio)} h
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => handleConfirmarTurno(t.id)}
                    >
                      <Check className="size-3.5" />
                      Confirmar
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Próximas sesiones */}
          <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
                <CalendarRange className="size-4 text-primary" />
                Próximas sesiones
              </h2>
              <Link href="/pro/agenda" className="text-xs font-semibold text-azul hover:underline">
                Ver agenda
              </Link>
            </div>

            <ul className="flex flex-col divide-y divide-border">
              {proximosTurnos.map((t) => (
                <li key={t.id} className="py-2.5">
                  <Link
                    href={`/pro/pacientes/${t.pacienteId}`}
                    className="flex items-center justify-between gap-2 text-sm hover:underline"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex size-7 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
                        {iniciales(t.paciente)}
                      </span>
                      <span className="font-medium text-foreground">
                        {nombreCompleto(t.paciente)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatDiaSemana(t.inicio)} {formatFechaCorta(t.inicio)} · {formatHora(t.inicio)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <ModalNuevoTurno open={modalNuevoTurno} onOpenChange={setModalNuevoTurno} />
    </>
  )
}
