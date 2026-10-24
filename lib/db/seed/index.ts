import type { Db } from '..'
import { seedAgenda } from './agenda'
import { seedCatalogs } from './catalogs'
import { seedClinical } from './clinical'
import { seedConnections } from './connections'
import { seedFollowUp } from './follow-up'
import { seedPeople } from './people'
import { seedSummaries } from './summaries'

// Order matters: each step references rows created by the previous ones.
// Every row has a deterministic id and inserts use ON CONFLICT DO NOTHING, so re-running is safe.
export async function runSeed(db: Db): Promise<void> {
  await seedCatalogs(db)
  await seedPeople(db)
  await seedConnections(db)
  await seedAgenda(db)
  await seedClinical(db)
  await seedFollowUp(db)
  await seedSummaries(db)
}
