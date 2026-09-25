import type { Session } from '@features/users/domain/session'

export interface ISessionsRepository {
  findById(id: string): Promise<Session | null>
  findByRefreshToken(refreshToken: string): Promise<Session | null>
  deleteById(id: string): Promise<void>
  deleteAllByUserId(userId: string): Promise<void>
  createSession(session: Session): Promise<void>
}