import type { FastifyReply, FastifyRequest } from 'fastify'
import type { ListVideosUseCase } from '@features/videos/application/list-videos.use-case'

export class ListVideosHandler {
  constructor(private readonly listVideosUseCase: ListVideosUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const videos = await this.listVideosUseCase.execute()

    return reply.send({
      status: 'success',
      message: 'Vídeos listados com sucesso!',
      videos,
    })
  }
}