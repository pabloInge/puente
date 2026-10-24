import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Icon, icons } from '@/components/ui/icon'
import { routes, type RouteId } from '@/lib/navigation'

import { PageHeader } from './page-header'
import { EmptyState } from './states'

type RoutePlaceholderProps = {
  routeId: RouteId
  /** Enlaces a rutas hijas o de ejemplo para recorrer la app antes de implementarla. */
  links?: { href: string; label: string }[]
}

export function RoutePlaceholder({ routeId, links }: RoutePlaceholderProps) {
  const route = routes[routeId]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={route.label}
        description={route.description}
        eyebrow={
          <Badge variant="outline" className="w-fit">
            En construcción ({route.task})
          </Badge>
        }
      />
      <EmptyState
        icon={route.icon}
        title="Esta sección todavía no está implementada"
        description={`La implementa la tarea ${route.task} del roadmap (docs/06-plan-de-commits.md).`}
        action={
          links?.length ? (
            <div className="flex flex-wrap justify-center gap-2">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className={buttonVariants({ variant: 'outline' })}>
                  {link.label}
                  <Icon icon={icons.ArrowRight} size="sm" data-icon="inline-end" />
                </Link>
              ))}
            </div>
          ) : undefined
        }
      />
    </div>
  )
}
