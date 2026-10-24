import { db, pool } from '../lib/db'
import { runSeed } from '../lib/db/seed'
import { DEMO_PASSWORD } from '../lib/db/seed/ids'
import { DEMO_ACCOUNTS } from '../lib/db/seed/people'

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed demo data with NODE_ENV=production')
  }

  await runSeed(db)
  console.log('Seed complete')
  console.log(`Admin: ${DEMO_ACCOUNTS.admin}`)
  console.log(`Professional 1: ${DEMO_ACCOUNTS.professionals[0].email}`)
  console.log(`Patient 1: ${DEMO_ACCOUNTS.patients[0].email}`)
  console.log(`Password (all accounts): ${DEMO_PASSWORD}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
