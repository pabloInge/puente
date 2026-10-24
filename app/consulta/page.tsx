'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  LoaderCircle,
  Mic,
  Phone,
  RotateCcw,
  Search,
  Sparkles,
  Undo2,
  X,
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
import { PuenteLogoIcon } from '@/components/layout/brand'
import {
  useSesionPaciente,
  guardarSesion,
  updateSesion,
  crearSesionInicial,
  activarDemoPaciente,
  procesarMensajeChat,
  rankearProfesionales,
  formatPesos,
  Profesional,
  PROFESIONALES_MOCK,
} from '@/lib/puente-demo'

const LINEAS_AYUDA = [
  { tel: '911', nombre: '911', detalle: 'Emergencias' },
  { tel: '107', nombre: '107', detalle: 'Emergencias médicas (SAME)' },
  { tel: '08009990091', nombre: '0800 999 0091', detalle: 'Línea de Salud Mental · gratuita, 24 hs' },
]

function LineasAyudaList() {
  return (
    <ul className="flex flex-col gap-2">
      {LINEAS_AYUDA.map((item) => (
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
  )
}

function AlertaRiesgo() {
  return (
    <section
      aria-label="Ayuda inmediata"
      className="flex flex-col gap-4 rounded-3xl border border-rosa/40 bg-rosa-claro p-5"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold tracking-tight text-tinta">
          No estás solo ni sola con esto.
        </h3>
        <p className="leading-relaxed text-tinta">
          Lo que contás es importante. Si sentís que podés hacerte daño, hablá ahora con alguien que puede ayudarte.
        </p>
      </div>
      <LineasAyudaList />
      <p className="text-sm text-gris">Cuando quieras, podemos seguir con la charla.</p>
    </section>
  )
}

function HeaderConsulta({
  titulo,
  progreso,
  contador,
  onVolver,
}: {
  titulo: string
  progreso?: { actual: number; total: number }
  contador?: string
  onVolver?: () => void
}) {
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3 px-5 pt-4 pb-3">
        <div className="grid grid-cols-[3rem_1fr_3rem] items-center">
          {onVolver ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onVolver}
              aria-label="Volver"
              className="-ml-3 text-azul"
            >
              <ArrowLeft aria-hidden="true" />
            </Button>
          ) : (
            <Link
              href="/"
              aria-label="Volver al inicio"
              className={buttonVariants({
                variant: 'ghost',
                size: 'icon',
                className: '-ml-3 text-azul',
              })}
            >
              <ArrowLeft aria-hidden="true" />
            </Link>
          )}
          <h1 className="text-center font-bold text-tinta">{titulo}</h1>
          <p className="text-right text-sm tabular-nums text-gris">
            {progreso ? (
              <>
                <span className="sr-only">Parte </span>
                {progreso.actual} de {progreso.total}
              </>
            ) : (
              contador
            )}
          </p>
        </div>

        {progreso && (
          <div
            className="h-1 overflow-hidden rounded-full bg-linea"
            role="progressbar"
            aria-label="Progreso de la charla"
            aria-valuemin={0}
            aria-valuemax={progreso.total}
            aria-valuenow={progreso.actual}
          >
            <div
              className="h-full rounded-full bg-azul transition-[width] duration-500 ease-out"
              style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
            />
          </div>
        )}
      </div>
    </header>
  )
}

// Separador de contexto y pregunta principal
function MensajeAsistente({ content, alerta }: { content: string; alerta?: boolean }) {
  const i = content.lastIndexOf('¿')
  let contexto = content
  let pregunta = ''

  if (i >= 0) {
    const antes = content.slice(0, i)
    const pos = Math.max(
      antes.lastIndexOf('. '),
      antes.lastIndexOf('! '),
      antes.lastIndexOf('? '),
      antes.lastIndexOf('\n')
    )
    const corte = pos < 0 ? 0 : pos + 1
    contexto = content.slice(0, corte).trim()
    pregunta = content.slice(corte).trim()
  }

  return (
    <div className="flex flex-col gap-4">
      {contexto && <p className="text-pretty text-lg leading-relaxed text-tinta">{contexto}</p>}
      {pregunta && (
        <h2 className="text-balance text-2xl font-bold tracking-tight text-azul md:text-3xl">
          {pregunta}
        </h2>
      )}
      {alerta && <AlertaRiesgo />}
    </div>
  )
}

function PuntitosTyping() {
  return (
    <div className="flex gap-1.5 py-2" role="status" aria-label="Escribiendo">
      {[0, 1, 2].map((n) => (
        <span
          key={n}
          className="size-2 animate-bounce rounded-full bg-azul/50 motion-reduce:animate-none"
          style={{ animationDelay: `${n * 140}ms` }}
        />
      ))}
    </div>
  )
}

function VoiceTextComposer({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled?: boolean
}) {
  const [grabando, setGrabando] = useState(false)
  const [transcribiendo, setTranscribiendo] = useState(false)
  const recognitionRef = useRef<any>(null)

  const handleMicClick = () => {
    if (typeof window === 'undefined') return
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      // Simular dictado rápido si el navegador no tiene la API
      setTranscribiendo(true)
      setTimeout(() => {
        onChange(value ? `${value} me cuesta descansar por las noches` : 'Últimamente me cuesta dormir y siento mucha presión.')
        setTranscribiendo(false)
      }, 1000)
      return
    }

    try {
      const rec = new SpeechRecognition()
      rec.lang = 'es-AR'
      rec.interimResults = false
      rec.continuous = false

      rec.onstart = () => setGrabando(true)
      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript
        onChange(value ? `${value} ${text}` : text)
      }
      rec.onerror = () => setGrabando(false)
      rec.onend = () => setGrabando(false)
      recognitionRef.current = rec
      rec.start()
    } catch {
      setGrabando(false)
    }
  }

  const handleStopMic = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setGrabando(false)
    }
  }

  const hasValue = value.trim().length > 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <label htmlFor="composer" className="sr-only">
          Escribí con tus palabras...
        </label>
        <textarea
          id="composer"
          rows={1}
          value={value}
          disabled={disabled || transcribiendo}
          placeholder={
            transcribiendo
              ? 'Pasando tu audio a texto…'
              : grabando
              ? 'Escuchando tu voz...'
              : 'Escribí con tus palabras...'
          }
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (hasValue && !disabled) onSubmit()
            }
          }}
          className="min-h-12 flex-1 resize-none rounded-2xl border border-azul/35 bg-card px-4 py-3 text-base leading-relaxed text-tinta placeholder:text-gris focus-visible:border-azul focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none disabled:opacity-60"
        />

        {transcribiendo ? (
          <Button size="icon-lg" disabled aria-label="Transcribiendo">
            <LoaderCircle className="animate-spin" />
          </Button>
        ) : grabando ? (
          <Button
            size="icon-lg"
            variant="destructive"
            onClick={handleStopMic}
            aria-label="Detener grabación"
          >
            <X />
          </Button>
        ) : hasValue ? (
          <Button
            size="icon-lg"
            onClick={onSubmit}
            disabled={disabled}
            aria-label="Enviar"
          >
            <ArrowRight />
          </Button>
        ) : (
          <Button
            size="icon-lg"
            variant="outline"
            onClick={handleMicClick}
            disabled={disabled}
            aria-label="Hablar en vez de escribir"
            title="Podés hablar en vez de escribir"
          >
            <Mic />
          </Button>
        )}
      </div>
      {!hasValue && (
        <p className="text-xs text-gris">
          Podés hablar en vez de escribir. No guardamos tu audio, solo el texto.
        </p>
      )}
    </div>
  )
}

function TarjetaProfesionalDetalle({
  pro,
  motivos,
  onPerfil,
}: {
  pro: Profesional
  motivos: string[]
  onPerfil: () => void
}) {
  return (
    <article className="flex flex-col gap-5 rounded-3xl border border-linea bg-card p-6 shadow-[0_1px_2px_rgb(35_48_79/0.04)]">
      <header className="flex items-center gap-4">
        <Image
          src={pro.foto}
          alt={`Foto de ${pro.nombre} ${pro.apellido}`}
          width={88}
          height={88}
          draggable={false}
          className="size-20 shrink-0 rounded-full bg-muted object-cover"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-tinta">
            {pro.nombre} {pro.apellido}
          </h2>
          <p className="text-sm leading-snug text-gris">
            Lic. en Psicología · {pro.matricula} · {pro.anios} años
          </p>
        </div>
      </header>

      <p className="text-pretty text-lg leading-relaxed text-tinta">
        “{pro.frase}”
      </p>

      {motivos.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-linea pt-5">
          <h3 className="text-sm font-medium text-gris">
            Por qué te {pro.genero === 'mujer' ? 'la' : 'lo'} presentamos
          </h3>
          <ul className="flex flex-col gap-2.5">
            {motivos.map((m) => (
              <li key={m} className="flex items-start gap-3 text-tinta">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-rosa" aria-hidden="true" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm text-gris">
        {pro.enfoques.join(' · ')} · {formatPesos(pro.honorario)}
      </p>

      <button
        type="button"
        onClick={onPerfil}
        className="self-start text-sm font-medium text-azul underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
      >
        Ver perfil completo
      </button>
    </article>
  )
}

function ModalPerfilPro({
  pro,
  onClose,
  onInteresa,
}: {
  pro: Profesional | null
  onClose: () => void
  onInteresa: () => void
}) {
  if (!pro) return null

  return (
    <Dialog open={!!pro} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-4 text-left">
          <Image
            src={pro.foto}
            alt=""
            width={72}
            height={72}
            className="size-16 shrink-0 rounded-full bg-muted object-cover"
          />
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-xl">
              {pro.nombre} {pro.apellido}
            </DialogTitle>
            <DialogDescription>
              Lic. en Psicología · {pro.matricula} · {pro.anios} años
            </DialogDescription>
          </div>
        </DialogHeader>

        <p className="leading-relaxed text-tinta">{pro.bio}</p>

        <dl className="flex flex-col gap-4 text-sm">
          <div className="flex flex-col gap-1 border-t border-linea pt-3">
            <dt className="text-xs font-medium text-gris">Enfoque</dt>
            <dd className="text-tinta">{pro.enfoques.join(' · ')}</dd>
          </div>
          <div className="flex flex-col gap-1 border-t border-linea pt-3">
            <dt className="text-xs font-medium text-gris">Formación</dt>
            <dd className="text-tinta">
              <ul className="flex flex-col gap-1">
                {pro.formacion.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </dd>
          </div>
          <div className="flex flex-col gap-1 border-t border-linea pt-3">
            <dt className="text-xs font-medium text-gris">Modalidad</dt>
            <dd className="text-tinta">
              {pro.modalidades.length > 1
                ? 'Online y presencial'
                : pro.modalidades[0] === 'virtual'
                ? 'Solo online'
                : 'Solo presencial'}
            </dd>
          </div>
          <div className="flex flex-col gap-1 border-t border-linea pt-3">
            <dt className="text-xs font-medium text-gris">Honorarios</dt>
            <dd className="text-tinta font-semibold">
              {formatPesos(pro.honorario)} · {pro.duracionMin} minutos
            </dd>
          </div>
        </dl>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Volver
          </Button>
          <Button onClick={onInteresa}>Me interesa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ModalContacto({
  open,
  onOpenChange,
  cantidad,
  inicial,
  enviando,
  onEnviar,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cantidad: number
  inicial: { nombre: string; via: 'whatsapp' | 'email'; valor: string } | null
  enviando: boolean
  onEnviar: (contacto: { nombre: string; via: 'whatsapp' | 'email'; valor: string }) => void
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [via, setVia] = useState<'whatsapp' | 'email'>(inicial?.via ?? 'whatsapp')
  const [valor, setValor] = useState(inicial?.valor ?? '')
  const [acepto, setAcepto] = useState(false)
  const [intentado, setIntentado] = useState(false)

  const valorValido =
    via === 'email'
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())
      : valor.replace(/\D/g, '').length >= 8
  const formValido = nombre.trim().length > 0 && valorValido && acepto

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIntentado(true)
    if (formValido) {
      onEnviar({ nombre: nombre.trim(), via, valor: valor.trim() })
    }
  }

  const fillGoogleDemo = () => {
    setNombre('Lucía')
    setVia('email')
    setValor('lucia.gomez@gmail.com')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Cómo te avisamos?</DialogTitle>
          <DialogDescription>
            {`Cuando ${
              cantidad === 1 ? 'el profesional te proponga' : 'alguno de los profesionales te proponga'
            } un horario, te escribimos. No necesitás crear una cuenta.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={fillGoogleDemo}
            className="h-12 w-full gap-3"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.2z"
              />
              <path
                fill="#34A853"
                d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.6H2.1v2.9A11 11 0 0 0 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.8 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.1H2.1A11 11 0 0 0 1 12c0 1.8.4 3.5 1.1 4.9L5.8 14z"
              />
              <path
                fill="#EA4335"
                d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1L5.8 10c.9-2.7 3.3-4.6 6.2-4.6z"
              />
            </svg>
            Continuar con Google
          </Button>

          <div className="flex items-center gap-3 text-sm text-gris" aria-hidden="true">
            <span className="h-px flex-1 bg-linea" />
            o
            <span className="h-px flex-1 bg-linea" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="c-nombre" className="text-sm font-medium text-tinta">
              Nombre o apodo
            </label>
            <input
              id="c-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="h-12 w-full rounded-2xl border border-azul/30 bg-card px-4 text-base text-tinta outline-none focus-visible:border-azul focus-visible:ring-3 focus-visible:ring-ring/30"
              placeholder="Ej.: Lucía"
              required
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-tinta">Te escribimos por</legend>
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
              {(['whatsapp', 'email'] as const).map((canal) => (
                <button
                  key={canal}
                  type="button"
                  aria-pressed={via === canal}
                  onClick={() => {
                    setVia(canal)
                    setValor('')
                  }}
                  className={`h-10 rounded-xl text-sm font-medium transition-colors ${
                    via === canal ? 'bg-card text-azul shadow-sm' : 'text-gris'
                  }`}
                >
                  {canal === 'whatsapp' ? 'WhatsApp' : 'Email'}
                </button>
              ))}
            </div>

            <input
              id="c-valor"
              type={via === 'email' ? 'email' : 'tel'}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={via === 'whatsapp' ? '+54 9 341 ...' : 'tu@email.com'}
              className="h-12 w-full rounded-2xl border border-azul/30 bg-card px-4 text-base text-tinta outline-none focus-visible:border-azul focus-visible:ring-3 focus-visible:ring-ring/30"
              required
            />
          </fieldset>

          <label className="flex items-start gap-3 text-sm leading-relaxed text-tinta cursor-pointer">
            <input
              type="checkbox"
              checked={acepto}
              onChange={(e) => setAcepto(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-azul"
            />
            <span>
              Acepto que mi resumen se comparta con{' '}
              {cantidad === 1 ? 'el profesional que elegí' : `los ${cantidad} profesionales que elegí`}.
            </span>
          </label>

          <Button
            type="submit"
            size="lg"
            className="h-12"
            disabled={enviando || (!formValido && intentado)}
          >
            {enviando && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
            Enviar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ConsultaPage() {
  const router = useRouter()
  const sesion = useSesionPaciente()
  const [inputTexto, setInputTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [modalContacto, setModalContacto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [proSeleccionado, setProSeleccionado] = useState<Profesional | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Inicializar sesión en storage si no existe
  useEffect(() => {
    if (typeof window !== 'undefined' && !sesion) {
      guardarSesion(crearSesionInicial())
    }
  }, [sesion])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [sesion?.chat.mensajes.length, pensando])

  if (!sesion) {
    return <div className="min-h-dvh bg-background" />
  }

  const { etapa, chat, vistos, elegidos } = sesion
  const { mensajes, estado, resumen } = chat

  const handleEnviarMensaje = async (texto: string) => {
    const clean = texto.trim()
    if (!clean || pensando) return
    setInputTexto('')

    const nuevosMensajes = [...mensajes, { role: 'user' as const, content: clean }]
    updateSesion((s) => ({
      ...s,
      chat: { ...s.chat, mensajes: nuevosMensajes },
    }))

    setPensando(true)
    try {
      // Simular delay de respuesta del asistente
      await new Promise((r) => setTimeout(r, 600))
      const res = procesarMensajeChat(nuevosMensajes, estado)

      updateSesion((s) => ({
        ...s,
        chat: {
          mensajes: [
            ...nuevosMensajes,
            {
              role: 'assistant',
              content: res.respuesta,
              opciones: res.opciones,
              alerta: res.alerta,
            },
          ],
          estado: res.estado,
          resumen: res.resumen ?? s.chat.resumen,
        },
      }))

      if (res.fin) {
        setTimeout(() => {
          updateSesion((s) => ({ ...s, etapa: 'cards' }))
        }, 1200)
      }
    } finally {
      setPensando(false)
    }
  }

  const handleMeInteresa = (proId: string) => {
    updateSesion((s) => {
      const nextElegidos =
        s.elegidos.length < 3 && !s.elegidos.includes(proId)
          ? [...s.elegidos, proId]
          : s.elegidos
      return {
        ...s,
        vistos: [...s.vistos, proId],
        elegidos: nextElegidos,
      }
    })
  }

  const handleAhoraNo = (proId: string) => {
    updateSesion((s) => ({
      ...s,
      vistos: [...s.vistos, proId],
    }))
  }

  const handleDeshacer = () => {
    const ultimo = vistos[vistos.length - 1]
    if (ultimo) {
      updateSesion((s) => ({
        ...s,
        vistos: s.vistos.slice(0, -1),
        elegidos: s.elegidos.filter((id) => id !== ultimo),
      }))
    }
  }

  const handleFinalizarContacto = async (contacto: {
    nombre: string
    via: 'whatsapp' | 'email'
    valor: string
  }) => {
    setEnviando(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      updateSesion((s) => ({
        ...s,
        contacto,
        etapa: 'enviado',
      }))
      setModalContacto(false)
    } finally {
      setEnviando(false)
    }
  }

  // Rankear profesionales
  const prosRankeados = resumen
    ? rankearProfesionales(PROFESIONALES_MOCK, resumen)
    : PROFESIONALES_MOCK.map((p) => ({
        profesional: p,
        afinidad: 85,
        motivos: ['Atiende online', `${p.anios} años de experiencia`],
      }))

  const prosDisponibles = prosRankeados.filter(
    (item) => !vistos.includes(item.profesional.id)
  )
  const proActual = prosDisponibles[0]

  // Último mensaje y opciones
  const ultimoMensaje = mensajes[mensajes.length - 1]
  const opcionesRapidas =
    !pensando && ultimoMensaje?.role === 'assistant' ? ultimoMensaje.opciones : undefined

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {etapa === 'chat' && (
        <>
          <HeaderConsulta
            titulo="Primera charla"
            progreso={{ actual: Math.min(4, Math.floor(estado.paso / 2) + 1), total: 4 }}
          />

          <main className="flex flex-1 flex-col">
            <ol className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-5 pt-4 pb-8" aria-live="polite">
              {mensajes.map((m, idx) => (
                <li key={idx} className={m.role === 'user' ? 'flex justify-end' : undefined}>
                  {m.role === 'user' ? (
                    <p className="max-w-[85%] rounded-3xl rounded-br-md bg-rosa-claro px-5 py-4 leading-relaxed text-tinta">
                      <span className="sr-only">Vos: </span>
                      {m.content}
                    </p>
                  ) : (
                    <MensajeAsistente content={m.content} alerta={m.alerta} />
                  )}
                </li>
              ))}

              {pensando && (
                <li>
                  <PuntitosTyping />
                </li>
              )}

              {opcionesRapidas && opcionesRapidas.length > 0 && (
                <li>
                  <ul className="flex flex-wrap gap-3" aria-label="Respuestas rápidas">
                    {opcionesRapidas.map((op) => (
                      <li key={op}>
                        <button
                          type="button"
                          onClick={() => handleEnviarMensaje(op)}
                          className="min-h-12 rounded-full border border-azul/30 bg-card px-5 text-azul transition-colors hover:border-azul hover:bg-azul/5 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                        >
                          {op}
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              )}
              <div ref={scrollRef} className="scroll-mb-40" />
            </ol>

            <div className="sticky bottom-0 border-t border-linea bg-background/95 backdrop-blur-md">
              <div className="mx-auto w-full max-w-xl px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <VoiceTextComposer
                  value={inputTexto}
                  onChange={setInputTexto}
                  onSubmit={() => handleEnviarMensaje(inputTexto)}
                  disabled={pensando}
                />
              </div>
            </div>
          </main>
        </>
      )}

      {etapa === 'cards' && (
        <>
          <HeaderConsulta
            titulo="Profesionales"
            onVolver={() => updateSesion((s) => ({ ...s, etapa: 'chat' }))}
          />

          <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 pt-2 pb-8">
            {proActual ? (
              <div className="flex flex-col gap-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h1 className="text-3xl font-bold tracking-tight text-azul">
                    Te presentamos a
                  </h1>
                  <p className="text-sm tabular-nums text-gris">
                    {vistos.length + 1} de {prosRankeados.length}
                  </p>
                </div>

                <TarjetaProfesionalDetalle
                  pro={proActual.profesional}
                  motivos={proActual.motivos}
                  onPerfil={() => setProSeleccionado(proActual.profesional)}
                />

                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 text-base"
                      onClick={() => handleAhoraNo(proActual.profesional.id)}
                    >
                      Ahora no
                    </Button>
                    <Button
                      size="lg"
                      className="h-14 text-base"
                      onClick={() => handleMeInteresa(proActual.profesional.id)}
                    >
                      Me interesa
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gris">Elegidos</span>
                    <ul className="flex gap-2" aria-label={`${elegidos.length} de 3 elegidos`}>
                      {Array.from({ length: 3 }).map((_, i) => {
                        const proElegido = PROFESIONALES_MOCK.find(
                          (p) => p.id === elegidos[i]
                        )
                        return (
                          <li key={i} className="size-9">
                            {proElegido ? (
                              <Image
                                src={proElegido.foto}
                                alt={proElegido.nombre}
                                width={36}
                                height={36}
                                className="size-9 rounded-full object-cover"
                              />
                            ) : (
                              <span className="block size-9 rounded-full border-2 border-dashed border-linea" />
                            )}
                          </li>
                        )
                      })}
                    </ul>
                    <span className="flex-1" />
                    {vistos.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeshacer}
                        className="text-gris gap-1.5"
                      >
                        <Undo2 className="size-4" />
                        Deshacer
                      </Button>
                    )}
                    {elegidos.length > 0 && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setModalContacto(true)}
                        className="px-0"
                      >
                        Continuar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Vista de resumen y confirmación
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h1 className="text-balance text-3xl font-bold tracking-tight text-azul">
                    {elegidos.length === 1
                      ? 'Elegiste a una persona'
                      : `Elegiste a ${elegidos.length} personas`}
                  </h1>
                  <p className="leading-relaxed text-tinta">
                    Les vamos a mandar tu resumen. Leelo antes: si querés, cambiá lo que no te represente.
                  </p>
                </div>

                <ul className="flex flex-col gap-2">
                  {elegidos.map((id) => {
                    const p = PROFESIONALES_MOCK.find((item) => item.id === id)
                    if (!p) return null
                    return (
                      <li
                        key={id}
                        className="flex items-center gap-3 rounded-2xl border border-linea bg-card p-3"
                      >
                        <Image
                          src={p.foto}
                          alt=""
                          width={44}
                          height={44}
                          className="size-11 rounded-full object-cover"
                        />
                        <span className="flex flex-col">
                          <span className="font-semibold text-tinta">
                            {p.nombre} {p.apellido}
                          </span>
                          <span className="text-sm text-gris">{p.disponible}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>

                {resumen && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="resumen-texto" className="text-sm font-medium text-gris">
                      Tu resumen
                    </label>
                    <textarea
                      id="resumen-texto"
                      rows={6}
                      value={resumen.texto}
                      onChange={(e) =>
                        updateSesion((s) =>
                          s.chat.resumen
                            ? {
                                ...s,
                                chat: {
                                  ...s.chat,
                                  resumen: { ...s.chat.resumen, texto: e.target.value },
                                },
                              }
                            : s
                        )
                      }
                      className="resize-none rounded-2xl border border-azul/30 bg-card p-4 leading-relaxed text-tinta focus-visible:border-azul focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                    />
                  </div>
                )}

                <label className="flex items-start gap-3 rounded-2xl bg-card p-4 text-sm leading-relaxed text-tinta cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sesion.conInforme}
                    onChange={(e) =>
                      updateSesion((s) => ({ ...s, conInforme: e.target.checked }))
                    }
                    className="mt-0.5 size-5 shrink-0 accent-azul"
                  />
                  <span>
                    <span className="font-medium">Ya hice terapia y tengo un informe.</span>{' '}
                    <span className="text-gris">
                      Le avisamos al profesional para que te lo pida si lo necesita.
                    </span>
                  </span>
                </label>

                <div className="flex flex-col gap-2 pt-4">
                  <Button
                    size="lg"
                    className="h-14 text-base"
                    onClick={() => setModalContacto(true)}
                  >
                    Enviar mi resumen ({elegidos.length})
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => updateSesion((s) => ({ ...s, vistos: [] }))}
                  >
                    Volver a ver perfiles
                  </Button>
                </div>
              </div>
            )}

            <ModalPerfilPro
              pro={proSeleccionado}
              onClose={() => setProSeleccionado(null)}
              onInteresa={() => {
                if (proSeleccionado) {
                  handleMeInteresa(proSeleccionado.id)
                  setProSeleccionado(null)
                }
              }}
            />

            <ModalContacto
              open={modalContacto}
              onOpenChange={setModalContacto}
              cantidad={elegidos.length}
              inicial={sesion.contacto}
              enviando={enviando}
              onEnviar={handleFinalizarContacto}
            />
          </main>
        </>
      )}

      {etapa === 'enviado' && (
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-5 py-10">
          <PuenteLogoIcon className="h-10 w-auto self-start" />
          <div className="flex flex-col gap-3">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-azul">
              ¡Listo{sesion.contacto ? `, ${sesion.contacto.nombre}` : ''}!
            </h1>
            <p className="text-pretty text-lg leading-relaxed text-tinta">
              Le mandamos tu resumen a{' '}
              {elegidos.length === 1 ? 'la persona que elegiste' : `las ${elegidos.length} personas que elegiste`}.
              Cuando {elegidos.length === 1 ? 'te proponga' : 'alguna te proponga'} un horario, te escribimos por{' '}
              {sesion.contacto?.via === 'email' ? 'email' : 'WhatsApp'}.
            </p>
          </div>

          <ul className="flex flex-col gap-2">
            {elegidos.map((id) => {
              const p = PROFESIONALES_MOCK.find((item) => item.id === id)
              if (!p) return null
              return (
                <li
                  key={id}
                  className="flex items-center gap-3 rounded-2xl border border-linea bg-card p-3"
                >
                  <Image
                    src={p.foto}
                    alt=""
                    width={44}
                    height={44}
                    className="size-11 rounded-full object-cover"
                  />
                  <span className="flex flex-1 flex-col">
                    <span className="font-semibold text-tinta">
                      {p.nombre} {p.apellido}
                    </span>
                    <span className="text-sm text-gris">Esperando respuesta</span>
                  </span>
                </li>
              )
            })}
          </ul>

          <div className="flex flex-col gap-3 rounded-3xl bg-rosa-claro p-5">
            <h2 className="font-bold text-tinta">Mientras tanto</h2>
            <p className="leading-relaxed text-tinta">
              En tu espacio podés anotar cómo te sentís cada día y ver tus próximas sesiones. Lo que escribas ahí es tuyo: vos decidís qué compartir.
            </p>
          </div>

          <Button
            size="lg"
            className="mt-auto h-14 text-base"
            onClick={() => {
              if (!sesion.panel) {
                guardarSesion(activarDemoPaciente(sesion))
              }
              router.push('/mi')
            }}
          >
            Ir a mi espacio
          </Button>
        </main>
      )}
    </div>
  )
}
