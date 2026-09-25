import type { FastifyReply, FastifyRequest } from 'fastify'
import { InvalidRefreshTokenException } from '@shared/exceptions/invalid-refresh-token.exception'
import type { RefreshTokenUseCase } from '@features/users/application/refresh-token.use-case'
import type { RefreshTokenDTO } from '@features/users/application/dtos'

export class RefreshTokenHandler {
  constructor(private readonly refreshTokenUseCase: RefreshTokenUseCase) {}

  async handle(request: FastifyRequest<{ Body: RefreshTokenDTO }>, reply: FastifyReply) {
    try {
      const tokens = await this.refreshTokenUseCase.execute(request.body)

      return reply.send({
        token: tokens.token,
        refresh_token: tokens.refresh_token,
      })
    } catch (error) {
      if (error instanceof InvalidRefreshTokenException) {
        return reply.status(401).send({
          status: 'error',
          message: error.message,
        })
      }

      throw error
    }
  }
}