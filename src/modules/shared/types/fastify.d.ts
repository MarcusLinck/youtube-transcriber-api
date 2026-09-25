import type { AuthUser } from '../lib/auth.ts'

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser | null
  }
}