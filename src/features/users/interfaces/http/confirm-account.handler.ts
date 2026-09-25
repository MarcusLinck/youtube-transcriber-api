import type { FastifyReply, FastifyRequest } from 'fastify'
import { InvalidConfirmationTokenException } from '@shared/exceptions/invalid-confirmation-token.exception'
import type { ConfirmAccountUseCase } from '@features/users/application/confirm-account.use-case'
import type { ConfirmAccountDTO } from '@features/users/application/dtos'

export class ConfirmAccountHandler {
  constructor(private readonly confirmAccountUseCase: ConfirmAccountUseCase) {}

  async handle(request: FastifyRequest<{ Body: ConfirmAccountDTO }>, reply: FastifyReply) {
    try {
      await this.confirmAccountUseCase.execute(request.body)

      return reply.send({
        status: 'success',
        message: 'Conta confirmada com sucesso!',
      })
    } catch (error) {
      if (error instanceof InvalidConfirmationTokenException) {
        return reply.status(404).send({
          status: 'error',
          message: error.message,
        })
      }

      throw error
    }
  }
}