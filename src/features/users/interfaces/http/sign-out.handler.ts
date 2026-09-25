import type { FastifyReply, FastifyRequest } from 'fastify'
import type { SignOutUseCase } from '@features/users/application/sign-out.use-case'

export class SignOutHandler {
  constructor(private readonly signOutUseCase: SignOutUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    await this.signOutUseCase.execute({ sessionId: request.user?.sessionId })

    return reply.send({
      status: 'success',
      message: 'Sessão encerrada com sucesso!',
    })
  }
}