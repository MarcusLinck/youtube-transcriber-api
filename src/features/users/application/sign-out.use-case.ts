import type { UseCase } from '@shared/contracts/use-case'
import type { ISessionsRepository } from '@features/users/infrastructure/storage/sessions-repository.interface'
import type { SignOutDTO } from '@features/users/application/dtos'

export class SignOutUseCase implements UseCase<SignOutDTO, void> {
  constructor(private readonly sessionsRepository: ISessionsRepository) {}

  async execute(input: SignOutDTO): Promise<void> {
    if (!input.sessionId) return

    await this.sessionsRepository.deleteById(input.sessionId)
  }
}