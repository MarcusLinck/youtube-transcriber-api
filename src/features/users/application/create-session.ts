import { Session } from '@features/users/domain/session'
import type { ISessionsRepository } from '@features/users/infrastructure/storage/sessions-repository.interface'
import { generateRefreshToken, refreshTokenExpiresAt } from '@features/users/application/jwt'

export async function createNewSession(
  sessionsRepository: ISessionsRepository,
  userId: string,
): Promise<Session> {
  await sessionsRepository.deleteAllByUserId(userId)

  const session = Session.create({
    user_id: userId,
    refresh_token: generateRefreshToken(),
    expires_at: refreshTokenExpiresAt(),
  })

  await sessionsRepository.createSession(session)

  return session
}