import { cn } from '@/lib/utils'

import { DesignSection } from './design-section'

const colorTokens = [
  { name: '--primary', className: 'bg-primary text-primary-foreground' },
  { name: '--accent', className: 'bg-accent text-accent-foreground' },
  { name: '--surface-1', className: 'bg-surface-1 text-foreground' },
  { name: '--surface-2', className: 'bg-surface-2 text-foreground' },
  { name: '--surface-3', className: 'bg-surface-3 text-foreground' },
  { name: '--muted', className: 'bg-muted text-muted-foreground' },
  { name: '--success', className: 'bg-success text-success-foreground' },
  { name: '--warning', className: 'bg-warning text-warning-foreground' },
  { name: '--danger', className: 'bg-danger text-danger-foreground' },
]

const elevations = [
  { name: '--shadow-2', className: 'shadow-2' },
  { name: '--shadow-4', className: 'shadow-4' },
  { name: '--shadow-8', className: 'shadow-8' },
  { name: '--shadow-16', className: 'shadow-16' },
]

const radii = [
  { name: 'sm', className: 'rounded-sm' },
  { name: 'md', className: 'rounded-md' },
  { name: 'lg', className: 'rounded-lg' },
  { name: 'xl', className: 'rounded-xl' },
]

export function TokenShowcase() {
  return (
    <>
      <DesignSection title="Colores" description="Tokens semánticos. Se ajustan solos en modo oscuro.">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {colorTokens.map((token) => (
            <li
              key={token.name}
              className={cn('flex h-20 items-end rounded-lg border p-3 font-mono text-xs', token.className)}
            >
              {token.name}
            </li>
          ))}
        </ul>
      </DesignSection>

      <DesignSection title="Elevación" description="Sombras estilo Fluent: ambiental más direccional.">
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {elevations.map((item) => (
            <li
              key={item.name}
              className={cn('flex h-20 items-center justify-center rounded-lg bg-surface-1 font-mono text-xs', item.className)}
            >
              {item.name}
            </li>
          ))}
        </ul>
      </DesignSection>

      <DesignSection title="Radios y tipografía">
        <div className="flex flex-col gap-6">
          <ul className="flex flex-wrap gap-4">
            {radii.map((item) => (
              <li
                key={item.name}
                className={cn('flex size-16 items-center justify-center border bg-surface-2 text-xs', item.className)}
              >
                {item.name}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-semibold tracking-tight text-balance">Encontrá a tu profesional</p>
            <p className="text-xl font-semibold">Próximo turno</p>
            <p className="max-w-prose leading-relaxed text-pretty">
              Texto de cuerpo con interlineado cómodo. La familia tipográfica se define una sola vez en{' '}
              <code className="rounded-sm bg-muted px-1 font-mono text-sm">--font-sans</code>.
            </p>
            <p className="text-sm text-muted-foreground">Texto secundario para ayudas y metadatos.</p>
          </div>
        </div>
      </DesignSection>
    </>
  )
}
