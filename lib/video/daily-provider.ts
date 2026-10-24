import {
  VideoNotConfiguredError,
  type VideoParticipant,
  type VideoProvider,
  type VideoRoom,
} from './types'

const DAILY_API = 'https://api.daily.co/v1'
const ROOM_GRACE_SECONDS = 60 * 60

const toUnix = (date: Date) => Math.floor(date.getTime() / 1000)

type DailyRoomResponse = { name: string; url: string }

async function dailyRequest<T>(apiKey: string, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${DAILY_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  }) as Promise<Response> & { _t?: T }
}

export function createDailyProvider(apiKey: string | undefined): VideoProvider {
  const isConfigured = Boolean(apiKey)

  function requireKey(): string {
    if (!apiKey) throw new VideoNotConfiguredError()
    return apiKey
  }

  return {
    isConfigured,

    async roomFor(appointment): Promise<VideoRoom> {
      const key = requireKey()
      const name = `puente-${appointment.id}`

      const create = await dailyRequest<DailyRoomResponse>(key, '/rooms', {
        method: 'POST',
        body: JSON.stringify({
          name,
          privacy: 'private',
          properties: {
            exp: toUnix(appointment.endsAt) + ROOM_GRACE_SECONDS,
            enable_chat: true,
            enable_knocking: false,
          },
        }),
      })

      if (create.ok) {
        const room = (await create.json()) as DailyRoomResponse
        return { name: room.name, url: room.url }
      }

      // La sala ya existe: es el caso normal al volver a entrar.
      const existing = await dailyRequest<DailyRoomResponse>(key, `/rooms/${name}`)
      if (!existing.ok) throw new Error(`No se pudo preparar la sala de video (${existing.status}).`)
      const room = (await existing.json()) as DailyRoomResponse
      return { name: room.name, url: room.url }
    },

    async tokenFor(participant: VideoParticipant, room: VideoRoom, expiresAt: Date) {
      const key = requireKey()
      const response = await dailyRequest(key, '/meeting-tokens', {
        method: 'POST',
        body: JSON.stringify({
          properties: {
            room_name: room.name,
            user_id: participant.userId,
            user_name: participant.displayName,
            is_owner: participant.isHost,
            exp: toUnix(expiresAt),
          },
        }),
      })
      if (!response.ok) throw new Error(`No se pudo generar el acceso a la sala (${response.status}).`)
      const { token } = (await response.json()) as { token: string }
      return token
    },
  }
}
