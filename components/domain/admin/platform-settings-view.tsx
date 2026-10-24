'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon, icons } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

type PlatformSettings = {
  advanceBookingHours: number
  cancellationNoticeHours: number
  journalEditWindowMinutes: number
  weeklyClosingDay: number
  naturalLanguageSearchEnabled: boolean
}

export function PlatformSettingsView({ initialSettings }: { initialSettings: PlatformSettings }) {
  const router = useRouter()
  const [advanceBookingHours, setAdvanceBookingHours] = useState(initialSettings.advanceBookingHours)
  const [cancellationNoticeHours, setCancellationNoticeHours] = useState(initialSettings.cancellationNoticeHours)
  const [journalEditWindowMinutes, setJournalEditWindowMinutes] = useState(initialSettings.journalEditWindowMinutes)
  const [weeklyClosingDay, setWeeklyClosingDay] = useState(initialSettings.weeklyClosingDay)
  const [naturalLanguageSearchEnabled, setNaturalLanguageSearchEnabled] = useState(initialSettings.naturalLanguageSearchEnabled)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  async function handleSaveKey(key: string, value: any) {
    setSavingKey(key)
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Configuración y parámetros globales</h2>
        <p className="text-sm text-muted-foreground">
          Reglas de negocio y comportamientos predeterminados de la plataforma (CU-G-05).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* P-05 Anticipación de turnos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Icon icon={icons.Calendar} size="sm" className="text-primary" />
              Anticipación mínima para solicitar turnos (P-05)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Horas previas requeridas por defecto para que un paciente pueda reservar un turno libre.
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={advanceBookingHours}
                onChange={(e) => setAdvanceBookingHours(parseInt(e.target.value) || 0)}
                className="w-24"
              />
              <span className="text-sm text-foreground">horas</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSaveKey('advance_booking_hours', advanceBookingHours)}
                disabled={savingKey === 'advance_booking_hours'}
              >
                {savingKey === 'advance_booking_hours' ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* R-10 Cancelación tardía */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Icon icon={icons.Clock} size="sm" className="text-primary" />
              Límite de cancelación tardía (R-10)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Horas antes del turno a partir de las cuales una cancelación se computa como tardía.
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={cancellationNoticeHours}
                onChange={(e) => setCancellationNoticeHours(parseInt(e.target.value) || 0)}
                className="w-24"
              />
              <span className="text-sm text-foreground">horas</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSaveKey('cancellation_notice_hours', cancellationNoticeHours)}
                disabled={savingKey === 'cancellation_notice_hours'}
              >
                {savingKey === 'cancellation_notice_hours' ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* R-07 Ventana edición diario */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Icon icon={icons.BookOpen} size="sm" className="text-primary" />
              Ventana de edición del diario (R-07)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Minutos transcurridos tras la creación en los que el paciente puede corregir una entrada.
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={journalEditWindowMinutes}
                onChange={(e) => setJournalEditWindowMinutes(parseInt(e.target.value) || 0)}
                className="w-24"
              />
              <span className="text-sm text-foreground">minutos</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSaveKey('journal_edit_window_minutes', journalEditWindowMinutes)}
                disabled={savingKey === 'journal_edit_window_minutes'}
              >
                {savingKey === 'journal_edit_window_minutes' ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Búsqueda en Lenguaje Natural */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Icon icon={icons.Sparkles} size="sm" className="text-primary" />
              Búsqueda en lenguaje natural (Mock / IA)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Habilita la interpretación semántica y recomendación de profesionales en el buscador principal.
            </p>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <Switch
                  checked={naturalLanguageSearchEnabled}
                  onCheckedChange={(checked) => {
                    setNaturalLanguageSearchEnabled(checked)
                    handleSaveKey('natural_language_search_enabled', checked)
                  }}
                />
                <span>Búsqueda semántica activada</span>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
