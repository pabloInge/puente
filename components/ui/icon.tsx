import type { LucideIcon, LucideProps } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Único punto de entrada de iconos (doc 05 §4).
 * El dominio pasa el icono como objeto; para migrar a Fluent Icons
 * solo cambia este archivo y el re-export de `icons`.
 */
export type IconComponent = LucideIcon

const sizes = { sm: 16, md: 20, lg: 24 } as const

type IconProps = Omit<LucideProps, 'size' | 'ref'> & {
  icon: IconComponent
  size?: keyof typeof sizes
  label?: string
}

export function Icon({ icon: Glyph, size = 'md', label, className, ...props }: IconProps) {
  return (
    <Glyph
      size={sizes[size]}
      strokeWidth={1.75}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      className={cn('shrink-0', className)}
      {...props}
    />
  )
}

export * as icons from 'lucide-react'
