'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, Lock, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useSesionPaciente } from '@/lib/puente-demo'

const pasos = [
  'Respondés unas preguntas, a tu ritmo.',
  'Te presentamos profesionales y te contamos por qué.',
  'Elegís con quién empezar. Le llega un resumen que vos aprobaste.',
]

const opcionesTiempo = ['Hace unos días', 'Hace semanas', 'Hace meses']

function AsistenteAvatar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-azul text-white ${className ?? ''}`}
    >
      <Sparkles className="size-4" />
    </span>
  )
}

function AnilloAfinidad({
  value,
  size = 52,
  className = '',
}: {
  value: number
  size?: number
  className?: string
}) {
  const strokeWidth = size * 0.1
  const radius = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * radius

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${value}% de afinidad`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
          className="stroke-primary transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute flex flex-col items-center leading-none" aria-hidden="true">
        <span
          className="font-heading font-semibold text-foreground"
          style={{ fontSize: size * 0.27 }}
        >
          {value}%
        </span>
      </span>
    </div>
  )
}

function ChatPreview() {
  return (
    <figure
      className="relative sm:pb-16 md:pb-12"
      aria-label="Ejemplo de cómo es la primera charla con el asistente"
    >
      <div className="flex flex-col gap-4 rounded-3xl bg-card p-5 pb-12 sm:pb-6 shadow-[0_24px_60px_-28px_rgb(35_48_79/0.35)] ring-1 ring-border sm:p-6">
        <p className="flex items-center gap-2 border-b border-linea pb-3 text-sm text-gris">
          <Lock className="size-3.5" aria-hidden="true" />
          Conversación privada
        </p>

        {/* Burbuja 1 */}
        <div className="animate-rise" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="flex items-end gap-2.5">
            <AsistenteAvatar />
            <p className="rounded-2xl rounded-bl-md bg-secondary px-4 py-2.5 text-[15px] text-tinta">
              ¿Qué te trae por acá?
            </p>
          </div>
        </div>

        {/* Burbuja 2 */}
        <div className="animate-rise" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
          <div className="flex justify-end">
            <p className="max-w-[85%] rounded-2xl rounded-br-md bg-azul px-4 py-2.5 text-[15px] leading-relaxed text-white">
              Empecé un trabajo nuevo y vivo con el pecho apretado. Me cuesta dormir.
            </p>
          </div>
        </div>

        {/* Burbuja 3 */}
        <div className="animate-rise" style={{ animationDelay: '900ms', animationFillMode: 'both' }}>
          <div className="flex items-end gap-2.5">
            <AsistenteAvatar />
            <div className="flex max-w-[88%] flex-col gap-2.5">
              <p className="rounded-2xl rounded-bl-md bg-secondary px-4 py-2.5 text-[15px] leading-relaxed text-tinta">
                Gracias por contármelo. Aparece algo de ansiedad y sueño. ¿Desde cuándo lo venís sintiendo?
              </p>
              <div className="flex flex-wrap gap-2" aria-hidden="true">
                {opcionesTiempo.map((op) => (
                  <span
                    key={op}
                    className="rounded-full border border-input px-3 py-1 text-sm text-tinta"
                  >
                    {op}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta flotante recomendación */}
      <div
        className="relative z-10 mx-3 -mt-8 flex animate-rise sm:absolute sm:right-0 sm:bottom-0 sm:mx-0 sm:mt-0 items-center gap-3 rounded-2xl bg-card p-3 pr-4 shadow-[0_18px_40px_-20px_rgb(35_48_79/0.4)] ring-1 ring-border motion-reduce:animate-none sm:-right-6 md:-bottom-4 sm:w-auto"
        style={{ animationDelay: '1400ms', animationFillMode: 'both' }}
      >
        <Image
          src="https://images.unsplash.com/photo-1594824813511-209861e6d42d?q=80&w=400&auto=format&fit=crop"
          alt="Foto de Martina Ferreyra"
          width={44}
          height={44}
          className="size-11 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <span className="font-semibold text-tinta">Lic. Martina Ferreyra</span>
          <span className="text-sm text-gris">TCC · Ansiedad, sueño</span>
          <span className="flex items-center gap-1 text-sm font-medium text-azul">
            <Check className="size-3.5" aria-hidden="true" />
            Encaja con lo que contaste
          </span>
        </div>
        <AnilloAfinidad value={94} size={52} className="ml-1" />
      </div>
    </figure>
  )
}

function HeroCta() {
  const sesion = useSesionPaciente()
  const destino = sesion?.panel ? '/mi' : '/consulta'
  const texto = sesion?.panel
    ? 'Ir a mi espacio'
    : sesion
    ? 'Seguir donde estaba'
    : 'Empezar a hablar'

  return (
    <div className="flex flex-col gap-3 md:max-w-sm">
      <Link
        href={destino}
        className={buttonVariants({
          size: 'lg',
          className: 'h-14 gap-2 text-lg',
        })}
      >
        {texto}
        <ArrowRight className="size-5" aria-hidden="true" />
      </Link>
      <p className="text-center text-gris">Gratis, privado y sin registrarte</p>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-6 pt-8 pb-16 md:pt-16">
      <section
        className="grid items-center gap-14 md:grid-cols-[1.1fr_1fr] md:gap-16"
        aria-labelledby="hero-titulo"
      >
        <div className="flex flex-col gap-6">
          <h1
            id="hero-titulo"
            className="text-balance text-6xl leading-[0.95] font-bold tracking-tighter text-rosa md:text-8xl"
          >
            Hablar es el primer paso.
          </h1>
          <p className="max-w-xl text-pretty text-xl leading-relaxed text-tinta">
            Contanos qué te pasa con tus palabras. Te presentamos psicólogos que trabajan con eso, y vos elegís con quién empezar.
          </p>
          <HeroCta />
        </div>
        <ChatPreview />
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="como-titulo">
        <h2 id="como-titulo" className="text-sm font-semibold tracking-wide text-gris uppercase">
          Cómo funciona
        </h2>
        <ol className="grid gap-x-10 md:grid-cols-3">
          {pasos.map((paso, i) => (
            <li
              key={paso}
              className="flex gap-5 border-t border-linea py-5 text-lg leading-relaxed text-tinta"
            >
              <span className="font-bold tabular-nums text-rosa" aria-hidden="true">
                {i + 1}
              </span>
              {paso}
            </li>
          ))}
        </ol>
        <p className="border-t border-linea pt-5 leading-relaxed text-gris">
          Las preguntas las hace un asistente automático. Los profesionales son personas reales con matrícula.
        </p>
      </section>
    </div>
  )
}
