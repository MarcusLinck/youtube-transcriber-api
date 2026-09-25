import type { UserRole } from '@features/users/domain/user'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  sessionId: string
}