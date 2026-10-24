export type VideoRoom = { name: string; url: string }

export type VideoParticipant = {
  userId: string
  displayName: string
  isHost: boolean
}

export interface VideoProvider {
  /** Falso cuando falta configuración: la UI muestra un aviso en lugar de fallar. */
  readonly isConfigured: boolean
  /** Sala privada y estable para un turno. Llamarla dos veces devuelve la misma sala. */
  roomFor(appointment: { id: string; startsAt: Date; endsAt: Date }): Promise<VideoRoom>
  /** Token de un solo participante, que vence al terminar el turno. */
  tokenFor(participant: VideoParticipant, room: VideoRoom, expiresAt: Date): Promise<string>
}

export class VideoNotConfiguredError extends Error {
  constructor() {
    super('La videollamada todavía no está configurada.')
    this.name = 'VideoNotConfiguredError'
  }
}

export function joinUrl(room: VideoRoom, token: string): string {
  return `${room.url}?t=${encodeURIComponent(token)}`
}
