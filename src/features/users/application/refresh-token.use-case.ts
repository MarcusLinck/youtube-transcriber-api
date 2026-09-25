import type { UseCase } from '@shared/contracts/use-case'
import type { ISessionsRepository } from '@features/users/infrastructure/storage/sessions-repository.interface'
import type { IUsersRepository } from '@features/users/infrastructure/storage/users-repository.interface'
import type { RefreshTokenDTO, ReturnRefreshTokenDTO } from '@features/users/application/dtos'
import { InvalidRefreshTokenException } from '@shared/exceptions/invalid-refresh-token.exception'
import { signAccessToken } from '@features/users/application/jwt'
import { createNewSession } from '@features/users/application/create-session'

export class RefreshTokenUseCase implements UseCase<RefreshTokenDTO, ReturnRefreshTokenDTO> {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly sessionsRepository: ISessionsRepository,
  ) {}

  async execute(input: RefreshTokenDTO): Promise<ReturnRefreshTokenDTO> {
    const session = await this.sessionsRepository.findByRefreshToken(input.refresh_token)

    if (!session || session.isExpired) {
      throw new InvalidRefreshTokenException()
    }

    const user = await this.usersRepository.findById(session.user_id)

    if (!user || !user.active) {
      throw new InvalidRefreshTokenException()
    }

    const newSession = await createNewSession(this.sessionsRepository, user.id)

    return {
      token: signAccessToken(user.id, user.email, newSession.id, user.role),
      refresh_token: newSession.refresh_token,
    }
  }
}