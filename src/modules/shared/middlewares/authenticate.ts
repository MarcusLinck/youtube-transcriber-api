import type { FastifyInstance } from 'fastify'
import { verifyAccessToken } from '@features/users/application/jwt'
import type { ISessionsRepository } from '@features/users/infrastructure/storage/sessions-repository.interface'
import type { AuthUser } from '../lib/auth.ts'

const PUBLIC_PATHS = [
  '/api/v1/auth/sign-up',
  '/api/v1/auth/sign-in',
  '/api/v1/auth/confirm',
  '/api/v1/auth/refresh-token',
  '/api/docs',
  '/docs',
]

export function authenticate(app: FastifyInstance, sessionsRepository: ISessionsRepository): void {
  const isMutationMethod = (method: string): boolean => !['GET', 'HEAD'].includes(method)

  app.decorateRequest('user', null)

  app.addHook('preHandler', async (request, reply) => {
    const path = request.url.split('?')[0]

    if (path === '/' || PUBLIC_PATHS.some((publicPath) => path.startsWith(publicPath))) {
      return
    }

    if (!isMutationMethod(request.method)) {
      return
    }

    const authorization = request.headers.authorization

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return reply.status(401).send({
        status: 'error',
        message: 'Token de autenticação não informado.',
      })
    }

    const token = authorization.slice('Bearer '.length)

    try {
      const payload = verifyAccessToken(token)

      const session = await sessionsRepository.findById(payload.sid)

      if (!session || session.isExpired || session.user_id !== payload.sub) {
        return reply.status(401).send({
          status: 'error',
          message: 'Sessão inválida ou expirada.',
        })
      }

      const isAuthPath = path.startsWith('/api/v1/auth/')

      if (isMutationMethod(request.method) && payload.role !== 'admin' && !isAuthPath) {
        return reply.status(403).send({
          status: 'error',
          message: 'Acesso negado. Apenas administradores podem realizar esta operação.',
        })
      }

      const authUser: AuthUser = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        sessionId: payload.sid,
      }
      request.user = authUser
    } catch {
      return reply.status(401).send({
        status: 'error',
        message: 'Token de autenticação inválido ou expirado.',
      })
    }
  })
}