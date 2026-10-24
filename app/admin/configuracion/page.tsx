import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PlatformSettingsView } from '@/components/domain/admin/platform-settings-view'
import { routes } from '@/lib/navigation'
import { getPlatformSettingsAdmin } from '@/lib/services/admin'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: routes.adminSettings.label }

export default async function AdminSettingsPage() {
  const session = await getSession()
  if (!session) redirect('/iniciar-sesion')

  const settings = await getPlatformSettingsAdmin(session)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      <PlatformSettingsView initialSettings={settings as any} />
    </div>
  )
}
