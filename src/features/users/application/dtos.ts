import type { User, UserRole } from '@features/users/domain/user'

export interface SignUpDTO {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

export interface UserDTO {
  id: string
  first_name: string
  last_name: string
  email: string
  role: UserRole
  confirmation_token: string | null
  created_at: Date
  updated_at: Date
  active: boolean
}

export type ReturnSignUpDTO = UserDTO

export interface SignInDTO {
  email: string
  password: string
}

export interface ConfirmAccountDTO {
  token: string
}

export interface AuthTokensDTO {
  token: string
  refresh_token: string
}

export type ReturnSignInDTO = AuthTokensDTO

export interface RefreshTokenDTO {
  refresh_token: string
}

export type ReturnRefreshTokenDTO = AuthTokensDTO

export interface SignOutDTO {
  sessionId?: string
}

export function userToDTO(user: User): UserDTO {
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
    confirmation_token: user.confirmation_token,
    created_at: user.created_at,
    updated_at: user.updated_at,
    active: user.active,
  }
}
