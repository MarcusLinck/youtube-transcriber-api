import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import type { UseCase } from '@shared/contracts/use-case'
import { User } from '@features/users/domain/user'
import type { IUsersRepository } from '@features/users/infrastructure/storage/users-repository.interface'
import type { SignUpDTO, ReturnSignUpDTO } from '@features/users/application/dtos'
import { userToDTO } from '@features/users/application/dtos'
import { PasswordMismatchException } from '@shared/exceptions/password-mismatch.exception'
import { EntityAlreadyExistsException } from '@shared/exceptions/entity-already-exists.exception'

export class SignUpUseCase implements UseCase<SignUpDTO, ReturnSignUpDTO> {
  constructor(private readonly usersRepository: IUsersRepository) {}

  async execute(input: SignUpDTO): Promise<ReturnSignUpDTO> {
    if (input.password !== input.confirmPassword) {
      throw new PasswordMismatchException()
    }

    const existingUser = await this.usersRepository.findByEmail(input.email)

    if (existingUser) {
      throw new EntityAlreadyExistsException('Já existe um usuário cadastrado com esse e-mail.')
    }

    const hashedPassword = await bcrypt.hash(input.password, 10)
    const confirmationToken = nanoid()

    const user = User.create({
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      password: hashedPassword,
      confirmationToken,
    })

    await this.usersRepository.createUser(user)

    return userToDTO(user)
  }
}
