import type { FastifyReply, FastifyRequest } from 'fastify'
import { PasswordMismatchException } from '@shared/exceptions/password-mismatch.exception'
import { EntityAlreadyExistsException } from '@shared/exceptions/entity-already-exists.exception'
import type { SignUpUseCase } from '@features/users/application/sign-up.use-case'
import type { SignUpDTO } from '@features/users/application/dtos'

export class SignUpHandler {
  constructor(private readonly signUpUseCase: SignUpUseCase) {}

  async handle(request: FastifyRequest<{ Body: SignUpDTO }>, reply: FastifyReply) {
    try {
      const user = await this.signUpUseCase.execute(request.body)

      return reply.status(201).send({
        status: 'success',
        message: 'Usuário criado com sucesso!',
        user,
      })
    } catch (error) {
      if (error instanceof PasswordMismatchException) {
        return reply.status(400).send({
          status: 'error',
          message: error.message,
        })
      }

      if (error instanceof EntityAlreadyExistsException) {
        return reply.status(409).send({
          status: 'error',
          message: error.message,
        })
      }

      throw error
    }
  }
}