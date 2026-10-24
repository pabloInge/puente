'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Check,
  HeartHandshake,
  Inbox,
  Send,
  ShieldAlert,
  Undo2,
  Video,
  MapPin,
  CalendarCheck,
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
  formatTiempoRelativo,
  formatFechaLarga,
  formatHora,
  iniciales,
  Solicitud,
  Paciente,
  Turno,
} from '@/lib/puente-pro-demo'

const MOTIVOS_DERIVACION = [
  'No tengo disponibilidad horaria',
  'El motivo de consulta excede mi especialidad',
  'Creo que otro enfoque le puede servir más',
]

function ModalAceptarSolicitud({
  solicitud,
  onClose,
}: {
  solicitud: Solicitud | null
  onClose: () => void
}) {
  const estadoPro = useDemoProfesional()
  const [fecha, setFecha] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().slice(0, 10)
  })
  const [hora, setHora] = useState('10:00')
  const [modalidad, setModalidad] = useState<'virtual' | 'presencial'>('virtual')
  const [matchExitoso, setMatchExitoso] = useState<{ pacienteId: string; inicio: string } | null>(null)

  if (!solicitud) return null
  const primerNombre = solicitud.contacto.nombre.split(' ')[0]

  const handleAceptar = (e: React.FormEvent) => {
    e.preventDefault()

    const [h, m] = hora.split(':').map(Number)
    const [y, mon, day] = fecha.split('-').map(Number)
    const inicio = new Date(y, mon - 1, day, h, m, 0, 0).toISOString()

    const [nombre, ...apellidos] = solicitud.contacto.nombre.trim().split(' ')
    const apellido = apellidos.join(' ') || ' '
    const nuevoPacId = `p_${Date.now()}`

    const nuevoPaciente: Paciente = {
      id: nuevoPacId,
      nombre,
      apellido,
      email: solicitud.contacto.email ?? '',
      telefono: solicitud.contacto.telefono ?? '+54 9 341 555-0000',
      fechaNacimiento: '1995-05-15',
      obraSocial: solicitud.resumen.preferencias.cobertura,
      motivoConsulta: solicitud.resumen.motivo,
      estado: 'activo',
      modalidad,
      frecuencia: 'Semanal',
      inicio: new Date().toISOString(),
      honorario: estadoPro.profesional.honorario,
      resumenInicial: solicitud.resumen,
    }

    const nuevoTurno: Turno = {
      id: `t_${Date.now()}`,
      pacienteId: nuevoPacId,
      inicio,
      duracionMin: 50,
      modalidad,
      estado: 'pendiente',
      paciente: {
        id: nuevoPacId,
        nombre,
        apellido,
      },
    }

    guardarDemoProfesional({
      ...estadoPro,
      pacientes: [...estadoPro.pacientes, nuevoPaciente],
      turnos: [...estadoPro.turnos, nuevoTurno],
      solicitudes: estadoPro.solicitudes.map((s) =>
        s.id === solicitud.id
          ? { ...s, estado: 'aceptada', pacienteId: nuevoPacId }
          : s
      ),
    })

    setMatchExitoso({ pacienteId: nuevoPacId, inicio })
  }

  return (
    <Dialog open={!!solicitud} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {matchExitoso ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center animate-in fade-in-0 zoom-in-95 duration-300">
            <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
              <HeartHandshake className="size-8" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="text-2xl">¡Es un match!</DialogTitle>
              <DialogDescription className="text-pretty">
                Le avisamos a {primerNombre} por email. Propusiste la primera entrevista para el{' '}
                {formatFechaLarga(matchExitoso.inicio).toLowerCase()} y queda pendiente de su confirmación.
              </DialogDescription>
            </div>
            <div className="grid w-full gap-2 sm:grid-cols-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Listo
              </Button>
              <Link
                href={`/pro/pacientes/${matchExitoso.pacienteId}`}
                className={buttonVariants()}
                onClick={onClose}
              >
                Ver ficha de {primerNombre}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Aceptar a {primerNombre}</DialogTitle>
              <DialogDescription>
                Proponé un horario para la primera entrevista. Se crea su ficha con el resumen que compartió.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAceptar} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ac-fecha" className="text-sm font-medium text-foreground">
                    Fecha
                  </label>
                  <input
                    id="ac-fecha"
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="h-11 rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus-visible:border-ring"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ac-hora" className="text-sm font-medium text-foreground">
                    Hora
                  </label>
                  <input
                    id="ac-hora"
                    type="time"
                    required
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="h-11 rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus-visible:border-ring"
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

              <DialogFooter className="flex gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit">Aceptar y proponer turno</Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ModalDerivarSolicitud({
  solicitud,
  onClose,
}: {
  solicitud: Solicitud | null
  onClose: () => void
}) {
  const estadoPro = useDemoProfesional()
  const [motivo, setMotivo] = useState(MOTIVOS_DERIVACION[0])

  if (!solicitud) return null
  const primerNombre = solicitud.contacto.nombre.split(' ')[0]

  const handleDerivar = (e: React.FormEvent) => {
    e.preventDefault()
    guardarDemoProfesional({
      ...estadoPro,
      solicitudes: estadoPro.solicitudes.map((s) =>
        s.id === solicitud.id
          ? { ...s, estado: 'derivada', motivoDerivacion: motivo }
          : s
      ),
    })
    toast.success('Solicitud derivada', {
      description: `Le sugerimos a ${primerNombre} otros profesionales compatibles.`,
    })
    onClose()
  }

  return (
    <Dialog open={!!solicitud} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Derivar a {primerNombre}</DialogTitle>
          <DialogDescription>
            No le mostramos el motivo. Le avisamos con cuidado y le sugerimos otros profesionales.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDerivar} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-foreground">Motivo (solo para vos)</legend>
            {MOTIVOS_DERIVACION.map((m) => (
              <label
                key={m}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
                  motivo === m
                    ? 'border-primary bg-secondary text-secondary-foreground'
                    : 'border-input text-foreground hover:bg-muted'
                }`}
              >
                <input
                  type="radio"
                  name="motivo-derivacion"
                  value={m}
                  checked={motivo === m}
                  onChange={() => setMotivo(m)}
                  className="size-4 accent-primary"
                />
                {m}
              </label>
            ))}
          </fieldset>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="secondary" className="gap-2">
              <Send className="size-4" />
              Derivar con cuidado
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function SolicitudesPage() {
  const estadoPro = useDemoProfesional()
  const [tab, setTab] = useState<'nueva' | 'aceptada' | 'todas'>('nueva')
  const [solicitudAceptar, setSolicitudAceptar] = useState<Solicitud | null>(null)
  const [solicitudDerivar, setSolicitudDerivar] = useState<Solicitud | null>(null)

  const solicitudesFiltradas = estadoPro.solicitudes.filter((s) => {
    if (tab === 'todas') return true
    return s.estado === tab
  })

  const countPorEstado = (st: 'nueva' | 'aceptada' | 'todas') => {
    if (st === 'todas') return estadoPro.solicitudes.length
    return estadoPro.solicitudes.filter((s) => s.estado === st).length
  }

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Solicitudes
        </h1>
        <p className="text-sm text-muted-foreground">
          Personas que leyeron tu perfil y te eligieron. Solo ves el resumen que aceptaron compartir.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-xl bg-secondary p-1">
        {(['nueva', 'aceptada', 'todas'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'nueva' ? 'Nuevas' : t === 'aceptada' ? 'Aceptadas' : 'Todas'}
            <span className="text-xs tabular-nums opacity-70">
              {countPorEstado(t)}
            </span>
          </button>
        ))}
      </div>

      {solicitudesFiltradas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
          <Inbox className="size-8 opacity-40" />
          <p className="font-medium text-foreground">
            {tab === 'nueva' ? 'Estás al día' : 'Nada por acá'}
          </p>
          <p className="text-sm">
            {tab === 'nueva'
              ? 'Cuando alguien te elija, su resumen va a aparecer acá.'
              : 'Todavía no hay solicitudes en esta lista.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {solicitudesFiltradas.map((s) => {
            const r = s.resumen
            return (
              <article
                key={s.id}
                className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border"
              >
                <header className="flex items-start gap-3">
                  <span className="inline-flex size-11 items-center justify-center rounded-full bg-secondary font-heading font-semibold text-sm text-secondary-foreground">
                    {iniciales({ nombre: s.contacto.nombre })}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <h2 className="font-heading text-lg font-semibold text-foreground">
                      {s.contacto.nombre}
                      {s.contacto.edad && (
                        <span className="font-normal text-muted-foreground">
                          , {s.contacto.edad}
                        </span>
                      )}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      Llegó {formatTiempoRelativo(s.fecha)}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold tabular-nums text-secondary-foreground">
                    {s.afinidad}% afinidad
                  </span>
                </header>

                {s.conInforme && (
                  <p className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground">
                    Viene con informe de su proceso anterior
                  </p>
                )}

                {r.riesgo === 'alto' && (
                  <p className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm leading-relaxed text-destructive">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                    En la conversación aparecieron señales de riesgo. Ya le compartimos líneas de ayuda; priorizá el contacto.
                  </p>
                )}

                <ul className="flex flex-wrap gap-1.5" aria-label="Temas">
                  {r.temas.map((tema) => (
                    <li
                      key={tema}
                      className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground capitalize"
                    >
                      {tema}
                    </li>
                  ))}
                </ul>

                <blockquote className="border-l-2 border-accent pl-3 text-pretty text-[15px] leading-relaxed text-foreground">
                  {r.texto}
                </blockquote>

                <dl className="grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-3 sm:grid-cols-4 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Desde</dt>
                    <dd className="font-medium text-foreground">{r.desde || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Modalidad</dt>
                    <dd className="font-medium text-foreground capitalize">{r.preferencias.modalidad}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Cobertura</dt>
                    <dd className="font-medium text-foreground">{r.preferencias.cobertura}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Prefiere</dt>
                    <dd className="font-medium text-foreground capitalize">{r.preferencias.genero}</dd>
                  </div>
                </dl>

                {s.estado === 'nueva' && (
                  <div className="grid gap-2 sm:flex sm:justify-end">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setSolicitudDerivar(s)}
                    >
                      <Undo2 className="size-4" />
                      Derivar
                    </Button>
                    <Button
                      className="gap-2"
                      onClick={() => setSolicitudAceptar(s)}
                    >
                      <Check className="size-4" />
                      Aceptar
                    </Button>
                  </div>
                )}

                {s.estado === 'aceptada' && s.pacienteId && (
                  <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                    <span className="text-sm font-medium text-secondary-foreground">
                      Aceptada · ya es tu paciente
                    </span>
                    <Link
                      href={`/pro/pacientes/${s.pacienteId}`}
                      className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                    >
                      Ver ficha
                    </Link>
                  </div>
                )}

                {s.estado === 'derivada' && (
                  <p className="border-t border-border pt-3 text-sm text-muted-foreground">
                    Derivada · {s.motivoDerivacion}
                  </p>
                )}
              </article>
            )
          })}
        </div>
      )}

      <ModalAceptarSolicitud
        solicitud={solicitudAceptar}
        onClose={() => setSolicitudAceptar(null)}
      />

      <ModalDerivarSolicitud
        solicitud={solicitudDerivar}
        onClose={() => setSolicitudDerivar(null)}
      />
    </>
  )
}
