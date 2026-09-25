import type { FastifyReply, FastifyRequest } from 'fastify'
import { EntityNotFoundException } from '@shared/exceptions/entity-not-found.exception'
import type { GetTranscriptionByVideoIdUseCase } from '@features/transcriptions/application/get-transcription-by-video-id.use-case'

export class GetTranscriptionByVideoIdHandler {
  constructor(
    private readonly getTranscriptionByVideoIdUseCase: GetTranscriptionByVideoIdUseCase,
  ) {}

  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params

    try {
      const transcription = await this.getTranscriptionByVideoIdUseCase.execute({ videoId: id })

      return reply.send({
        status: 'success',
        message: 'Transcrição encontrada com sucesso!',
        transcription,
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