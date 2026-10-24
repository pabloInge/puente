import Link from 'next/link'
import { cn } from '@/lib/utils'

export function PuenteLogoIcon({
  className,
  onBlue = false,
}: {
  className?: string
  onBlue?: boolean
}) {
  return (
    <svg
      viewBox="0 0 200 130"
      aria-hidden="true"
      className={cn('h-6 w-auto', className)}
    >
      <path
        d="M22 118 A58 58 0 0 1 138 118"
        fill="none"
        stroke="#FF48B0"
        strokeWidth="30"
        style={{ mixBlendMode: onBlue ? 'normal' : 'multiply' }}
      />
      <path
        d="M62 118 A58 58 0 0 1 178 118"
        fill="none"
        stroke={onBlue ? '#F7F5F0' : '#3255A4'}
        strokeWidth="30"
        style={{ mixBlendMode: onBlue ? 'normal' : 'multiply' }}
      />
    </svg>
  )
}

export function PuenteLogoText({
  className,
  onBlue = false,
}: {
  className?: string
  onBlue?: boolean
}) {
  return (
    <span
      className={cn(
        'font-sans text-2xl leading-none font-extrabold',
        onBlue ? 'text-papel' : 'text-azul',
        className
      )}
      style={{ letterSpacing: '-0.045em' }}
    >
      puente
    </span>
  )
}

export function Brand({
  href = '/',
  className,
  onBlue = false,
  label,
}: {
  href?: string
  className?: string
  onBlue?: boolean
  label?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-end gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      aria-label={label ? `puente ${label}, ir al inicio` : 'puente, ir al inicio'}
    >
      <PuenteLogoIcon onBlue={onBlue} className="mb-1 h-5" />
      <PuenteLogoText onBlue={onBlue} />
      {label && (
        <span className="mb-0.5 text-sm font-medium text-muted-foreground">
          {label}
        </span>
      )}
    </Link>
  )
}
