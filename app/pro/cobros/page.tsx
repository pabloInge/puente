'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Check,
  CheckCircle2,
  CircleDollarSign,
  MessageCircle,
  Plus,
  Wallet,
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
  formatPesos,
  formatFechaCorta,
  nombreCompleto,
  iniciales,
  Pago,
} from '@/lib/puente-pro-demo'

const METODOS_PAGO = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'obra social', label: 'Obra social' },
]

function ModalRegistrarPago({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const estadoPro = useDemoProfesional()
  const pacientes = estadoPro.pacientes.filter((p) => p.estado === 'activo')

  const [pacienteId, setPacienteId] = useState(pacientes[0]?.id ?? '')
  const [monto, setMonto] = useState('28000')
  const [metodo, setMetodo] = useState('transferencia')
  const [concepto, setConcepto] = useState('Sesión')

  const handleRegistrar = (e: React.FormEvent) => {
    e.preventDefault()
    const pac = estadoPro.pacientes.find((p) => p.id === pacienteId)
    if (!pac || !Number(monto)) return

    const nuevoPago: Pago = {
      id: `pg_${Date.now()}`,
      pacienteId: pac.id,
      fecha: new Date().toISOString(),
      monto: Number(monto),
      estado: 'pagado',
      metodo,
      concepto: concepto || 'Sesión',
      paciente: {
        id: pac.id,
        nombre: pac.nombre,
        apellido: pac.apellido,
        telefono: pac.telefono,
      },
    }

    guardarDemoProfesional({
      ...estadoPro,
      pagos: [nuevoPago, ...estadoPro.pagos],
    })

    toast.success('Pago registrado')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Para pagos que no estaban cargados como pendientes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleRegistrar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pago-paciente" className="text-sm font-medium text-foreground">
              Paciente
            </label>
            <select
              id="pago-paciente"
              value={pacienteId}
              onChange={(e) => {
                setPacienteId(e.target.value)
                const p = pacientes.find((item) => item.id === e.target.value)
                if (p) setMonto(String(p.honorario))
              }}
              className="h-11 rounded-xl border border-input bg-card px-3.5 text-[15px] outline-none focus-visible:border-ring"
              required
            >
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {nombreCompleto(p)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pago-monto" className="text-sm font-medium text-foreground">
                Monto
              </label>
              <input
                id="pago-monto"
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="h-11 rounded-xl border border-input bg-card px-3.5 text-[15px] tabular-nums outline-none focus-visible:border-ring"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="pago-metodo" className="text-sm font-medium text-foreground">
                Método
              </label>
              <select
                id="pago-metodo"
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                className="h-11 rounded-xl border border-input bg-card px-3.5 text-[15px] outline-none focus-visible:border-ring"
              >
                {METODOS_PAGO.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="pago-concepto" className="text-sm font-medium text-foreground">
              Concepto
            </label>
            <input
              id="pago-concepto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className="h-11 rounded-xl border border-input bg-card px-3.5 text-[15px] outline-none focus-visible:border-ring"
            />
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Registrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TarjetaCobroPendiente({
  pacienteId,
  pagos,
}: {
  pacienteId: string
  pagos: Pago[]
}) {
  const estadoPro = useDemoProfesional()
  const pac = estadoPro.pacientes.find((p) => p.id === pacienteId)
  const [metodo, setMetodo] = useState('transferencia')

  if (!pac) return null

  const totalDeuda = pagos.reduce((acc, p) => acc + p.monto, 0)
  const nombre = nombreCompleto(pac)

  const mensajeWhatsApp = `Hola ${pac.nombre}, ¿cómo estás? Te paso el saldo pendiente: ${
    pagos.length
  } ${pagos.length === 1 ? 'sesión' : 'sesiones'} por ${formatPesos(
    totalDeuda
  )}. Cualquier cosa me avisás. ¡Gracias!`

  const linkWa = `https://wa.me/${pac.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(
    mensajeWhatsApp
  )}`

  const handleSaldarTodo = () => {
    guardarDemoProfesional({
      ...estadoPro,
      pagos: estadoPro.pagos.map((p) =>
        pagos.some((item) => item.id === p.id)
          ? { ...p, estado: 'pagado', metodo }
          : p
      ),
    })
    toast.success(`${pac.nombre} quedó al día`)
  }

  const handlePagarUno = (pagoId: string) => {
    guardarDemoProfesional({
      ...estadoPro,
      pagos: estadoPro.pagos.map((p) =>
        p.id === pagoId ? { ...p, estado: 'pagado', metodo } : p
      ),
    })
    toast.success('Pago registrado')
  }

  return (
    <li className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary font-heading font-semibold text-xs text-secondary-foreground">
          {iniciales(pac)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <Link href={`/pro/pacientes/${pac.id}`} className="truncate font-medium text-tinta hover:underline">
            {nombre}
          </Link>
          <span className="text-sm text-muted-foreground">
            {pagos.length} {pagos.length === 1 ? 'sesión' : 'sesiones'} sin pagar
          </span>
        </div>
        <span className="font-heading text-xl font-semibold text-rosa tabular-nums">
          {formatPesos(totalDeuda)}
        </span>
      </div>

      <ul className="flex flex-col divide-y divide-border rounded-xl bg-muted px-3">
        {pagos.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="min-w-0 truncate text-tinta">{p.concepto}</span>
            <div className="flex items-center gap-2">
              <span className="tabular-nums text-tinta font-medium">
                {formatPesos(p.monto)}
              </span>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => handlePagarUno(p.id)}
                className="gap-1"
              >
                <Check className="size-3" />
                Pagada
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={metodo}
          onChange={(e) => setMetodo(e.target.value)}
          className="h-9 min-w-36 flex-1 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring"
        >
          {METODOS_PAGO.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <Button size="sm" onClick={handleSaldarTodo} className="gap-1.5">
          <CircleDollarSign className="size-4" />
          Saldar todo
        </Button>

        <a
          href={linkWa}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ size: 'sm', variant: 'outline', className: 'gap-1.5' })}
        >
          <MessageCircle className="size-4" />
          Recordar
        </a>
      </div>
    </li>
  )
}

export default function CobrosPage() {
  const estadoPro = useDemoProfesional()
  const [tab, setTab] = useState<'pendientes' | 'historial'>('pendientes')
  const [modalRegistro, setModalRegistro] = useState(false)

  const pagosPendientes = estadoPro.pagos.filter((p) => p.estado === 'pendiente')
  const totalPendiente = pagosPendientes.reduce((acc, p) => acc + p.monto, 0)

  const mesActual = new Date().getMonth()
  const anioActual = new Date().getFullYear()
  const cobradoMes = estadoPro.pagos
    .filter((p) => {
      const d = new Date(p.fecha)
      return p.estado === 'pagado' && d.getMonth() === mesActual && d.getFullYear() === anioActual
    })
    .reduce((acc, p) => acc + p.monto, 0)

  // Agrupar pendientes por paciente
  const pendientesPorPaciente = useMemo(() => {
    const map = new Map<string, Pago[]>()
    pagosPendientes.forEach((p) => {
      map.set(p.pacienteId, [...(map.get(p.pacienteId) ?? []), p])
    })
    return [...map.entries()].sort((a, b) => {
      const sumaA = a[1].reduce((acc, p) => acc + p.monto, 0)
      const sumaB = b[1].reduce((acc, p) => acc + p.monto, 0)
      return sumaB - sumaA
    })
  }, [pagosPendientes])

  const historialPagados = estadoPro.pagos
    .filter((p) => p.estado === 'pagado')
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Cobros
          </h1>
          <p className="text-sm text-muted-foreground">
            Lo que entró, lo que falta y a quién recordarle.
          </p>
        </div>

        <Button onClick={() => setModalRegistro(true)} className="gap-2">
          <Plus className="size-4" />
          Registrar pago
        </Button>
      </header>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5 rounded-2xl bg-card p-4 ring-1 ring-border md:p-5">
          <span className="text-sm text-muted-foreground">Por cobrar</span>
          <span className="font-heading text-2xl font-semibold tabular-nums text-rosa md:text-3xl">
            {formatPesos(totalPendiente)}
          </span>
          <span className="text-xs text-muted-foreground">
            {pagosPendientes.length} sesiones sin pagar
          </span>
        </div>

        <div className="flex flex-col gap-1.5 rounded-2xl bg-card p-4 ring-1 ring-border md:p-5">
          <span className="text-sm text-muted-foreground">Cobrado este mes</span>
          <span className="font-heading text-2xl font-semibold tabular-nums text-foreground md:text-3xl">
            {formatPesos(cobradoMes)}
          </span>
        </div>

        <div className="col-span-2 lg:col-span-1 flex flex-col gap-1.5 rounded-2xl bg-card p-4 ring-1 ring-border md:p-5">
          <span className="text-sm text-muted-foreground">Pacientes con saldo</span>
          <span className="font-heading text-2xl font-semibold tabular-nums text-foreground md:text-3xl">
            {pendientesPorPaciente.length}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-xl bg-secondary p-1">
        {(['pendientes', 'historial'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`h-9 rounded-lg px-4 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-card text-tinta shadow-sm'
                : 'text-muted-foreground hover:text-tinta'
            }`}
          >
            {t === 'pendientes' ? 'Por cobrar' : 'Historial'}
          </button>
        ))}
      </div>

      {tab === 'pendientes' ? (
        pendientesPorPaciente.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
            <CheckCircle2 className="size-8 text-primary opacity-60" />
            <p className="font-medium text-foreground">Todo al día</p>
            <p className="text-sm">No hay sesiones pendientes de pago.</p>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {pendientesPorPaciente.map(([pid, items]) => (
              <TarjetaCobroPendiente key={pid} pacienteId={pid} pagos={items} />
            ))}
          </ul>
        )
      ) : historialPagados.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
          <Wallet className="size-8 opacity-40" />
          <p className="font-medium text-foreground">Sin pagos todavía</p>
          <p className="text-sm">Cuando registres pagos, los vas a ver acá.</p>
        </div>
      ) : (
        <section className="rounded-2xl bg-card ring-1 ring-border" aria-label="Historial de pagos">
          <ul className="divide-y divide-border">
            {historialPagados.map((p) => {
              const pac = estadoPro.pacientes.find((item) => item.id === p.pacienteId)
              return (
                <li
                  key={p.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-0.5 px-5 py-3.5 sm:grid-cols-[7rem_minmax(0,1fr)_9rem_7rem]"
                >
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {formatFechaCorta(p.fecha)}
                  </span>
                  <div className="min-w-0 truncate text-sm">
                    {pac ? (
                      <Link href={`/pro/pacientes/${pac.id}`} className="font-medium text-tinta hover:underline">
                        {nombreCompleto(pac)}
                      </Link>
                    ) : (
                      <span className="font-medium text-tinta">Paciente</span>
                    )}
                    <span className="text-muted-foreground"> · {p.concepto}</span>
                  </div>
                  <span className="hidden text-sm text-muted-foreground capitalize sm:block">
                    {p.metodo}
                  </span>
                  <span className="text-right font-semibold text-tinta tabular-nums">
                    {formatPesos(p.monto)}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <ModalRegistrarPago open={modalRegistro} onOpenChange={setModalRegistro} />
    </>
  )
}
