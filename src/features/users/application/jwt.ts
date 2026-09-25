import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import type { UserRole } from '@features/users/domain/user'

const JWT_SECRET = process.env.JWT_SECRET ?? 'fastfy-secret-key'
const ACCESS_TOKEN_EXPIRES_IN = '15m'
export const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000

export function signAccessToken(
  userId: string,
  email: string,
  sessionId: string,
  role: UserRole,
): string {
  return jwt.sign({ sub: userId, email, sid: sessionId, role }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  })
}

export interface AccessTokenPayload {
  sub: string
  email: string
  sid: string
  role: UserRole
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AccessTokenPayload
}

export function generateRefreshToken(): string {
  return randomUUID()
}

export function refreshTokenExpiresAt(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS)
}