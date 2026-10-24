import type { ReactNode } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Icon, icons, type IconComponent } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'

type EmptyStateProps = {
  title: string
  description?: string
  icon?: IconComponent
  action?: ReactNode
}

export function EmptyState({ title, description, icon = icons.Inbox, action }: EmptyStateProps) {
  return (
    <Empty className="border border-dashed border-border bg-surface-1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon icon={icon} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}

export function ErrorState({
  title = 'No pudimos cargar esta sección',
  description = 'Probá de nuevo en unos segundos. Si el problema sigue, avisanos.',
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <Alert variant="destructive">
      <Icon icon={icons.CircleAlert} />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{description}</p>
        {action ? <div className="mt-3">{action}</div> : null}
      </AlertDescription>
    </Alert>
  )
}

export function LoadingSkeleton({ rows = 3, label = 'Cargando' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
    </div>
  )
}
