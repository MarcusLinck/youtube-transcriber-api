import type { FastifyReply, FastifyRequest } from 'fastify'
import { EntityAlreadyExistsException } from '@shared/exceptions/entity-already-exists.exception'
import { EntityNotFoundException } from '@shared/exceptions/entity-not-found.exception'
import type { CreateChaptersUseCase } from '@features/chapters/application/create-chapters.use-case'

export class CreateChaptersHandler {
  constructor(private readonly createChaptersUseCase: CreateChaptersUseCase) {}

  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params

    try {
      const chapter = await this.createChaptersUseCase.execute({ videoId: id })

      return reply.status(201).send({
        status: 'success',
        message: 'Capítulos criados com sucesso!',
        chapter,
      })
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        return reply.status(404).send({
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