import type { FastifyReply, FastifyRequest } from 'fastify'
import { InvalidCredentialsException } from '@shared/exceptions/invalid-credentials.exception'
import { AccountNotActiveException } from '@shared/exceptions/account-not-active.exception'
import type { SignInUseCase } from '@features/users/application/sign-in.use-case'
import type { SignInDTO } from '@features/users/application/dtos'

export class SignInHandler {
  constructor(private readonly signInUseCase: SignInUseCase) {}

  async handle(request: FastifyRequest<{ Body: SignInDTO }>, reply: FastifyReply) {
    try {
      const { token, refresh_token } = await this.signInUseCase.execute(request.body)

      return reply.send({
        token,
        refresh_token,
      })
    } catch (error) {
      if (error instanceof InvalidCredentialsException) {
        return reply.status(401).send({
          status: 'error',
          message: error.message,
        })
      }

      if (error instanceof AccountNotActiveException) {
        return reply.status(403).send({
          status: 'error',
          message: error.message,
        })
      }

      throw error
    }
  }
}