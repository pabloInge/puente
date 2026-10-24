import 'server-only'
import { randomUUID } from 'node:crypto'
import { del, get, put } from '@vercel/blob'
import { InvalidInputError, NotFoundError } from '@/lib/services/errors'

/** Tipos admitidos para adjuntos clínicos y de chat. */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export type StoredFile = {
  /** Identificador interno. Es lo único que se guarda en la base y nunca se expone como URL. */
  pathname: string
  contentType: string
  size: number
  originalName: string
}

function sanitizeName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'archivo'
  const cleaned = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-80)
  return cleaned || 'archivo'
}

export function validateUpload(file: File): void {
  if (file.size === 0) {
    throw new InvalidInputError({ file: 'El archivo está vacío.' })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new InvalidInputError({ file: 'El archivo supera el máximo de 10 MB.' })
  }
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    throw new InvalidInputError({ file: 'Solo se admiten PDF e imágenes (PNG, JPG o WebP).' })
  }
}

/**
 * Sube un archivo a un store privado. `scope` agrupa por vínculo o conversación
 * (por ejemplo `bonds/<bondId>/documents`). El sufijo aleatorio evita colisiones y adivinanzas.
 * El llamador es responsable de haber autorizado la subida con `requireBondAccess`.
 */
export async function uploadPrivate(scope: string, file: File): Promise<StoredFile> {
  validateUpload(file)
  const pathname = `${scope.replace(/^\/+|\/+$/g, '')}/${randomUUID()}-${sanitizeName(file.name)}`

  const blob = await put(pathname, file, {
    access: 'private',
    addRandomSuffix: false,
    contentType: file.type,
  })

  return {
    pathname: blob.pathname,
    contentType: file.type,
    size: file.size,
    originalName: file.name,
  }
}

/**
 * Entrega un archivo privado como Response. El llamador debe autorizar antes
 * (el pathname sale de un registro que ya pasó por `requireBondAccess`).
 */
export async function streamPrivate(
  pathname: string,
  options: { ifNoneMatch?: string | null; downloadName?: string } = {},
): Promise<Response> {
  const result = await get(pathname, {
    access: 'private',
    ifNoneMatch: options.ifNoneMatch ?? undefined,
  })
  if (!result) throw new NotFoundError('No encontramos el archivo.')

  const headers = new Headers({ 'Cache-Control': 'private, no-cache' })

  if (result.statusCode === 304) {
    headers.set('ETag', result.blob.etag)
    return new Response(null, { status: 304, headers })
  }

  headers.set('Content-Type', result.blob.contentType)
  headers.set('ETag', result.blob.etag)
  headers.set('X-Content-Type-Options', 'nosniff')
  if (options.downloadName) {
    headers.set(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(options.downloadName)}`,
    )
  }
  return new Response(result.stream, { headers })
}

export async function deletePrivate(pathname: string): Promise<void> {
  await del(pathname)
}
