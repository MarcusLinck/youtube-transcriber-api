import type { FastifyReply, FastifyRequest } from 'fastify'
import { EntityNotFoundException } from '@shared/exceptions/entity-not-found.exception'
import type { GetChaptersByVideoIdUseCase } from '@features/chapters/application/get-chapters-by-video-id.use-case'

export class GetChaptersByVideoIdHandler {
  constructor(private readonly getChaptersByVideoIdUseCase: GetChaptersByVideoIdUseCase) {}

  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params

    try {
      const chapter = await this.getChaptersByVideoIdUseCase.execute({ videoId: id })

      return reply.send({
        status: 'success',
        message: 'Capítulos encontrados com sucesso!',
        chapter,
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