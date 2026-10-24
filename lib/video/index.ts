import 'server-only'
import { createDailyProvider } from './daily-provider'
import type { VideoProvider } from './types'

export * from './types'

/** Daily.co. Sin `DAILY_API_KEY` el proveedor queda inactivo y `isConfigured` es falso. */
export const videoProvider: VideoProvider = createDailyProvider(process.env.DAILY_API_KEY)
