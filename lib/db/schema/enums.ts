import { pgEnum } from 'drizzle-orm/pg-core'

export const modalityEnum = pgEnum('modality', ['in_person', 'online', 'both'])
