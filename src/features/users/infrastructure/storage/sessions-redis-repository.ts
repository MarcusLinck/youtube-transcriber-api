import Redis from 'ioredis'
import type { ISessionsRepository } from '@features/users/infrastructure/storage/sessions-repository.interface'
import { Session } from '@features/users/domain/session'
import type { SessionEntityData } from '@features/users/domain/session'

interface SessionStoredData {
  id: string
  user_id: string
  refresh_token: string
  expires_at: string
  created_at: string
  updated_at: string
}

const SESSION_KEY_PREFIX = 'session'
const USER_SESSION_KEY_PREFIX = 'user_session'
const REFRESH_KEY_PREFIX = 'refresh'

const sessionKey = (id: string): string => `${SESSION_KEY_PREFIX}:${id}`
const userSessionKey = (userId: string): string => `${USER_SESSION_KEY_PREFIX}:${userId}`
const refreshKey = (refreshToken: string): string => `${REFRESH_KEY_PREFIX}:${refreshToken}`

function toStoredData(session: Session): SessionStoredData {
  return {
    id: session.id,
    user_id: session.user_id,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at.toISOString(),
    created_at: session.created_at.toISOString(),
    updated_at: session.updated_at.toISOString(),
  }
}

function toSession(data: SessionStoredData): Session {
  return Session.toEntity({
    id: data.id,
    user_id: data.user_id,
    refresh_token: data.refresh_token,
    expires_at: new Date(data.expires_at),
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  } satisfies SessionEntityData)
}

function ttlInMs(expiresAt: Date): number {
  return Math.max(1, expiresAt.getTime() - Date.now())
}

export class SessionsRedisRepository implements ISessionsRepository {
  constructor(private readonly client: Redis) {}

  async findById(id: string): Promise<Session | null> {
    const raw = await this.client.get(sessionKey(id))

    if (!raw) return null

    return toSession(JSON.parse(raw) as SessionStoredData)
  }

  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    const sessionId = await this.client.get(refreshKey(refreshToken))

    if (!sessionId) return null

    return this.findById(sessionId)
  }

  async deleteById(id: string): Promise<void> {
    const raw = await this.client.get(sessionKey(id))

    if (!raw) return

    const stored = JSON.parse(raw) as SessionStoredData

    await this.client.del(
      sessionKey(id),
      userSessionKey(stored.user_id),
      refreshKey(stored.refresh_token),
    )
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    const sessionId = await this.client.get(userSessionKey(userId))

    if (!sessionId) return

    const raw = await this.client.get(sessionKey(sessionId))

    const keysToDelete = [sessionKey(sessionId), userSessionKey(userId)]

    if (raw) {
      const stored = JSON.parse(raw) as SessionStoredData
      keysToDelete.push(refreshKey(stored.refresh_token))
    }

    await this.client.del(...keysToDelete)
  }

  async createSession(session: Session): Promise<void> {
    const ttl = ttlInMs(session.expires_at)

    const pipeline = this.client.multi()
    pipeline.set(sessionKey(session.id), JSON.stringify(toStoredData(session)), 'PX', ttl)
    pipeline.set(userSessionKey(session.user_id), session.id, 'PX', ttl)
    pipeline.set(refreshKey(session.refresh_token), session.id, 'PX', ttl)

    await pipeline.exec()
  }
}