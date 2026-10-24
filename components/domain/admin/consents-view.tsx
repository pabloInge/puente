'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Icon, icons } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'

type ConsentVersion = {
  id: string
  kind: 'informed_consent' | 'terms' | 'privacy'
  version: string
  bodyMd: string
  publishedAt: Date | string | null
  isCurrent: boolean
}

const KIND_LABELS = {
  informed_consent: 'Consentimiento informado (R-08)',
  terms: 'Términos y condiciones',
  privacy: 'Política de privacidad',
}

export function ConsentsView({ versions }: { versions: ConsentVersion[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<'informed_consent' | 'terms' | 'privacy'>('informed_consent')
  const [version, setVersion] = useState('')
  const [bodyMd, setBodyMd] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewItem, setPreviewItem] = useState<ConsentVersion | null>(null)

  function openPublish(targetKind?: 'informed_consent' | 'terms' | 'privacy') {
    if (targetKind) setKind(targetKind)
    setVersion('')
    setBodyMd('')
    setOpen(true)
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    if (!confirm('¿Publicar esta nueva versión? La versión actual anterior se archivará y las aceptaciones existentes no serán alteradas.')) {
      return
    }
    setLoading(true)
    try {
      await fetch('/api/admin/consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, version, bodyMd }),
      })
      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const kinds: ('informed_consent' | 'terms' | 'privacy')[] = [
    'informed_consent',
    'terms',
    'privacy',
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Consentimientos y términos legales</h2>
          <p className="text-sm text-muted-foreground">
            Control de versiones. Publicar una nueva versión no invalida aceptaciones previas (CU-G-03).
          </p>
        </div>
        <Button onClick={() => openPublish()} className="flex items-center gap-2">
          <Icon icon={icons.Plus} size="sm" />
          Publicar nueva versión
        </Button>
      </div>

      <div className="flex flex-col gap-8">
        {kinds.map((k) => {
          const kindVersions = versions.filter((v) => v.kind === k)
          const currentVersion = kindVersions.find((v) => v.isCurrent)

          return (
            <div key={k} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">{KIND_LABELS[k]}</h3>
                <Button variant="outline" size="sm" onClick={() => openPublish(k)}>
                  + Nueva versión
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {kindVersions.map((v) => (
                  <Card key={v.id} className={v.isCurrent ? 'border-primary/50 shadow-1' : 'opacity-80'}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-bold">v{v.version}</CardTitle>
                        {v.isCurrent ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">Vigente</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Histórica</Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setPreviewItem(v)}>
                        Ver texto
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-1 text-xs text-muted-foreground">
                      Publicada: {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString('es-AR') : 'S/D'}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Publish Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Publicar nueva versión legal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePublish} className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Tipo de documento</label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as any)}
                  className="w-full rounded-md border border-border bg-background p-2 text-sm"
                >
                  <option value="informed_consent">Consentimiento informado</option>
                  <option value="terms">Términos y condiciones</option>
                  <option value="privacy">Política de privacidad</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Número de versión</label>
                <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Ej. 1.2" required />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Contenido (Markdown)</label>
              <textarea
                value={bodyMd}
                onChange={(e) => setBodyMd(e.target.value)}
                placeholder="Ingresá las cláusulas y contenido legal en formato Markdown..."
                rows={10}
                className="w-full rounded-md border border-border bg-background p-3 text-sm font-mono outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Publicando...' : 'Publicar versión'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={Boolean(previewItem)} onOpenChange={(o) => !o && setPreviewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {previewItem && `${KIND_LABELS[previewItem.kind]} — v${previewItem.version}`}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm whitespace-pre-wrap font-sans text-foreground leading-relaxed">
            {previewItem?.bodyMd}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
