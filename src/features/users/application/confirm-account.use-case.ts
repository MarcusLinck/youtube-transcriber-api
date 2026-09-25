import type { UseCase } from '@shared/contracts/use-case'
import type { IUsersRepository } from '@features/users/infrastructure/storage/users-repository.interface'
import type { ConfirmAccountDTO } from '@features/users/application/dtos'
import { InvalidConfirmationTokenException } from '@shared/exceptions/invalid-confirmation-token.exception'

export class ConfirmAccountUseCase implements UseCase<ConfirmAccountDTO, void> {
  constructor(private readonly usersRepository: IUsersRepository) {}

  async execute(input: ConfirmAccountDTO): Promise<void> {
    const user = await this.usersRepository.findByConfirmationToken(input.token)

    if (!user) {
      throw new InvalidConfirmationTokenException()
    }

    user.confirm()

    await this.usersRepository.updateUser(user)
  }
}