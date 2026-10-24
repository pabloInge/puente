'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type PatientProfileFormProps = {
  initialData: {
    firstName: string
    lastName: string
    dni: string | null
    gender: string | null
    phone: string | null
    province: string | null
    city: string | null
    coverageId: string | null
    coverageMemberNumber: string | null
    emergencyContactName: string | null
    emergencyContactPhone: string | null
    initialTopics: string | null
  }
  coverages: { id: string; name: string }[]
}

export function PatientProfileForm({ initialData, coverages }: PatientProfileFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/patient/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al guardar los datos.')
      setMessage({ type: 'success', text: 'Tus datos se guardaron correctamente.' })
      router.refresh()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {message && (
        <div
          className={`rounded-lg p-4 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Datos Personales */}
      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
          <CardDescription>
            Tu DNI se encuentra cifrado y protegido en el servidor (R-06). Solo el profesional con un vínculo activo tendrá acceso a él.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="patient-first-name" className="mb-1 block text-xs font-medium text-foreground">Nombre</label>
            <Input
              id="patient-first-name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <label htmlFor="patient-last-name" className="mb-1 block text-xs font-medium text-foreground">Apellido</label>
            <Input
              id="patient-last-name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
          <div>
            <label htmlFor="patient-dni" className="mb-1 block text-xs font-medium text-foreground">DNI (Cifrado)</label>
            <Input
              id="patient-dni"
              value={formData.dni ?? ''}
              onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
              placeholder="Número de documento"
            />
          </div>
          <div>
            <label htmlFor="patient-phone" className="mb-1 block text-xs font-medium text-foreground">Teléfono</label>
            <Input
              id="patient-phone"
              value={formData.phone ?? ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+54 11 ..."
            />
          </div>
          <div>
            <label htmlFor="patient-province" className="mb-1 block text-xs font-medium text-foreground">Provincia</label>
            <Input
              id="patient-province"
              value={formData.province ?? ''}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="patient-city" className="mb-1 block text-xs font-medium text-foreground">Localidad / Ciudad</label>
            <Input
              id="patient-city"
              value={formData.city ?? ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cobertura */}
      <Card>
        <CardHeader>
          <CardTitle>Cobertura médica</CardTitle>
          <CardDescription>
            Si contás con obra social, prepaga o programa de salud, seleccionala para acceder a honorarios bonificados.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="patient-coverage" className="mb-1 block text-xs font-medium text-foreground">Obra social / Prepaga / Programa</label>
            <select
              id="patient-coverage"
              aria-label="Obra social / Prepaga / Programa"
              value={formData.coverageId ?? ''}
              onChange={(e) => setFormData({ ...formData, coverageId: e.target.value || null })}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Sin cobertura (Particular)</option>
              {coverages.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="patient-member-number" className="mb-1 block text-xs font-medium text-foreground">Número de afiliado / credencial</label>
            <Input
              id="patient-member-number"
              value={formData.coverageMemberNumber ?? ''}
              onChange={(e) => setFormData({ ...formData, coverageMemberNumber: e.target.value })}
              placeholder="Ej: 002-34981-01"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacto de Emergencia */}
      <Card>
        <CardHeader>
          <CardTitle>Contacto de emergencia</CardTitle>
          <CardDescription>
            Persona de confianza a quien recurrir en caso de necesidad médica o urgencia.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="patient-emergency-name" className="mb-1 block text-xs font-medium text-foreground">Nombre completo</label>
            <Input
              id="patient-emergency-name"
              value={formData.emergencyContactName ?? ''}
              onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              placeholder="Familiar, pareja o allegado"
            />
          </div>
          <div>
            <label htmlFor="patient-emergency-phone" className="mb-1 block text-xs font-medium text-foreground">Teléfono de contacto</label>
            <Input
              id="patient-emergency-phone"
              value={formData.emergencyContactPhone ?? ''}
              onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              placeholder="+54 11 ..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Motivos iniciales */}
      <Card>
        <CardHeader>
          <CardTitle>Temas iniciales de consulta</CardTitle>
          <CardDescription>
            Una breve descripción de lo que te gustaría trabajar o los motivos de tu búsqueda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.initialTopics ?? ''}
            onChange={(e) => setFormData({ ...formData, initialTopics: e.target.value })}
            placeholder="Ej: Ansiedad, cambios laborales, duelo, vínculos..."
            rows={4}
          />
        </CardContent>
        <CardFooter className="flex justify-end border-t border-border pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
