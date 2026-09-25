import type { User } from '@features/users/domain/user'

export interface IUsersRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByConfirmationToken(confirmationToken: string): Promise<User | null>
  createUser(user: User): Promise<void>
  updateUser(user: User): Promise<void>
}
