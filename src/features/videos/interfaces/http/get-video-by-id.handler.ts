import type { FastifyReply, FastifyRequest } from 'fastify'
import { EntityNotFoundException } from '@shared/exceptions/entity-not-found.exception'
import type { GetVideoByIdUseCase } from '@features/videos/application/get-video-by-id.use-case'

export class GetVideoByIdHandler {
  constructor(private readonly getVideoByIdUseCase: GetVideoByIdUseCase) {}

  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params

    try {
      const video = await this.getVideoByIdUseCase.execute({ id })

      return reply.send({
        status: 'success',
        message: 'Vídeo encontrado com sucesso!',
        video,
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