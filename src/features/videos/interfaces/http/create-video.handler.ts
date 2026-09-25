import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateVideoUseCase } from '@features/videos/application/create-video.use-case'

export class CreateVideoHandler {
  constructor(private readonly createVideoUseCase: CreateVideoUseCase) {}

  async handle(
    request: FastifyRequest<{ Body: { url: string } }>,
    reply: FastifyReply,
  ) {
    const { url } = request.body

    const video = await this.createVideoUseCase.execute({ url })

    return reply.status(201).send({
      status: 'success',
      message: 'Vídeo criado com sucesso!',
      video,
    })
  }
}