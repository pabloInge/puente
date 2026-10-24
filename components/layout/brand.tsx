import Link from 'next/link'

import { Icon, icons } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

export function Brand({ href = '/', className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 rounded-md font-semibold tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Icon icon={icons.Waypoints} size="md" />
      </span>
      <span className="text-lg">Puente</span>
    </Link>
  )
}
