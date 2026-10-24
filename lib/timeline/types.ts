export type TimelineEventKind =
  | 'clinical_entry'
  | 'appointment'
  | 'indication'
  | 'summary'
  | 'bond'

export type TimelineEvent = {
  id: string
  date: Date
  kind: TimelineEventKind
  title: string
  summary?: string
  href?: string
}

export type TimelineSource = (bondId: string) => Promise<TimelineEvent[]>
