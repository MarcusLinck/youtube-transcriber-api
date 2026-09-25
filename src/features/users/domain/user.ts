import { nanoid } from 'nanoid'

export type UserRole = 'user' | 'admin'

export interface UserEntityData {
  id: string
  first_name: string
  last_name: string
  email: string
  password: string
  role: UserRole
  confirmation_token: string | null
  created_at: Date
  updated_at: Date
  active: boolean
  deleted_at: Date | null
}

export interface CreateUserEntityData {
  first_name: string
  last_name: string
  email: string
  password: string
  role?: UserRole
  confirmationToken?: string | null
}

export class User {
  private constructor(private data: UserEntityData) {}

  static create(data: CreateUserEntityData): User {
    const now = new Date()

    return new User({
      id: nanoid(),
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password: data.password,
      role: data.role ?? 'user',
      confirmation_token: data.confirmationToken ?? null,
      created_at: now,
      updated_at: now,
      active: false,
      deleted_at: null,
    })
  }

  static toEntity(data: UserEntityData): User {
    return new User(data)
  }

  confirm(): void {
    this.data.active = true
    this.data.confirmation_token = null
    this.data.updated_at = new Date()
  }

  get id(): string {
    return this.data.id
  }

  get first_name(): string {
    return this.data.first_name
  }

  get last_name(): string {
    return this.data.last_name
  }

  get email(): string {
    return this.data.email
  }

  get password(): string {
    return this.data.password
  }

  get role(): UserRole {
    return this.data.role
  }

  get confirmation_token(): string | null {
    return this.data.confirmation_token
  }

  get created_at(): Date {
    return this.data.created_at
  }

  get updated_at(): Date {
    return this.data.updated_at
  }

  get active(): boolean {
    return this.data.active
  }

  get deleted_at(): Date | null {
    return this.data.deleted_at
  }
}
