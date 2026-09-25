import bcrypt from 'bcryptjs'
import type { UseCase } from '@shared/contracts/use-case'
import type { IUsersRepository } from '@features/users/infrastructure/storage/users-repository.interface'
import type { ISessionsRepository } from '@features/users/infrastructure/storage/sessions-repository.interface'
import type { SignInDTO, ReturnSignInDTO } from '@features/users/application/dtos'
import { InvalidCredentialsException } from '@shared/exceptions/invalid-credentials.exception'
import { AccountNotActiveException } from '@shared/exceptions/account-not-active.exception'
import { signAccessToken } from '@features/users/application/jwt'
import { createNewSession } from '@features/users/application/create-session'

export class SignInUseCase implements UseCase<SignInDTO, ReturnSignInDTO> {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly sessionsRepository: ISessionsRepository,
  ) {}

  async execute(input: SignInDTO): Promise<ReturnSignInDTO> {
    const user = await this.usersRepository.findByEmail(input.email)

    if (!user) {
      throw new InvalidCredentialsException()
    }

    const passwordMatches = await bcrypt.compare(input.password, user.password)

    if (!passwordMatches) {
      throw new InvalidCredentialsException()
    }

    if (!user.active) {
      throw new AccountNotActiveException()
    }

    const session = await createNewSession(this.sessionsRepository, user.id)

    return {
      token: signAccessToken(user.id, user.email, session.id, user.role),
      refresh_token: session.refresh_token,
    }
  }
}