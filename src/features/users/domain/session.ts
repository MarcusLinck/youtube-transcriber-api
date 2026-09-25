import { nanoid } from 'nanoid'

export interface SessionEntityData {
  id: string
  user_id: string
  refresh_token: string
  expires_at: Date
  created_at: Date
  updated_at: Date
}

export interface CreateSessionEntityData {
  user_id: string
  refresh_token: string
  expires_at: Date
}

export class Session {
  private constructor(private readonly data: SessionEntityData) {}

  static create(data: CreateSessionEntityData): Session {
    const now = new Date()

    return new Session({
      id: nanoid(),
      user_id: data.user_id,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      created_at: now,
      updated_at: now,
    })
  }

  static toEntity(data: SessionEntityData): Session {
    return new Session(data)
  }

  get id(): string {
    return this.data.id
  }

  get user_id(): string {
    return this.data.user_id
  }

  get refresh_token(): string {
    return this.data.refresh_token
  }

  get expires_at(): Date {
    return this.data.expires_at
  }

  get created_at(): Date {
    return this.data.created_at
  }

  get updated_at(): Date {
    return this.data.updated_at
  }

  get isExpired(): boolean {
    return this.data.expires_at.getTime() <= Date.now()
  }
}