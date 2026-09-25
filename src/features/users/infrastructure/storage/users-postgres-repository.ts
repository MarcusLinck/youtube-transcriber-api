import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import * as schema from '@shared/db/schema'
import type { IUsersRepository } from '@features/users/infrastructure/storage/users-repository.interface'
import { User } from '@features/users/domain/user'

export class UsersPostgresRepository implements IUsersRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findById(id: string): Promise<User | null> {
    const [result] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))

    if (!result) return null

    return User.toEntity(result)
  }

  async findByEmail(email: string): Promise<User | null> {
    const [result] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))

    if (!result) return null

    return User.toEntity(result)
  }

  async findByConfirmationToken(confirmationToken: string): Promise<User | null> {
    const [result] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.confirmation_token, confirmationToken))

    if (!result) return null

    return User.toEntity(result)
  }

  async createUser(user: User): Promise<void> {
    await this.db.insert(schema.users).values({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: user.password,
      role: user.role,
      confirmation_token: user.confirmation_token,
      created_at: user.created_at,
      updated_at: user.updated_at,
      active: user.active,
    })
  }

  async updateUser(user: User): Promise<void> {
    await this.db
      .update(schema.users)
      .set({
        role: user.role,
        confirmation_token: user.confirmation_token,
        active: user.active,
        updated_at: user.updated_at,
      })
      .where(eq(schema.users.id, user.id))
  }
}
