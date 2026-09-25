import type { FastifyReply, FastifyRequest } from 'fastify'
import { EntityNotFoundException } from '@shared/exceptions/entity-not-found.exception'
import type { DeleteChaptersByVideoIdUseCase } from '@features/chapters/application/delete-chapters-by-video-id.use-case'

export class DeleteChaptersByVideoIdHandler {
  constructor(private readonly deleteChaptersByVideoIdUseCase: DeleteChaptersByVideoIdUseCase) {}

  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params

    try {
      await this.deleteChaptersByVideoIdUseCase.execute({ videoId: id })

      return reply.send({
        status: 'success',
        message: 'Capítulos excluídos com sucesso!',
      })
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        return reply.status(404).send({
          status: 'error',
          message: error.message,
        })
      }

      throw error
    }
  }
}