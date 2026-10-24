import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Icon, icons } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { routes } from '@/lib/navigation'

const steps = [
  {
    icon: icons.Search,
    title: 'Buscá',
    text: 'Por rama, modalidad, cobertura o contando con tus palabras qué te pasa.',
  },
  {
    icon: icons.MessageSquare,
    title: 'Conversá',
    text: 'Escribile al profesional antes de pedir el primer turno.',
  },
  {
    icon: icons.Handshake,
    title: 'Empezá',
    text: 'Turnos, sesiones online, diario e indicaciones en un solo lugar.',
  },
]

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-12 lg:px-8 lg:py-20">
      <section className="flex max-w-3xl flex-col gap-6">
        <h1 className="text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
          Un puente entre lo que te pasa y quien te puede acompañar.
        </h1>
        <p className="max-w-prose text-lg leading-relaxed text-pretty text-muted-foreground">
          Encontrá profesionales de la psicología en Argentina, con tu cobertura o programa, y seguí tu tratamiento desde un
          mismo lugar.
        </p>

        {/* Dual Search: Natural Language Search Form */}
        <form action="/buscar" method="GET" className="mt-2 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Input
              name="q"
              placeholder="Contanos qué estás buscando o qué te pasa..."
              className="h-12 text-base pr-10"
            />
          </div>
          <button
            type="submit"
            className={buttonVariants({ size: 'lg', className: 'h-12' })}
          >
            <Icon icon={icons.Search} size="sm" data-icon="inline-start" />
            Buscar
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link href={routes.search.href} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Ver todos los profesionales
          </Link>
          <Link href={routes.signUp.href} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Soy profesional
          </Link>
        </div>
      </section>

      <section aria-labelledby="como-funciona" className="flex flex-col gap-6">
        <h2 id="como-funciona" className="text-xl font-semibold text-foreground">
          Cómo funciona
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.title} className="flex flex-col gap-3 rounded-lg border border-border bg-surface-1 p-5 shadow-2">
              <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <Icon icon={step.icon} />
              </span>
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
