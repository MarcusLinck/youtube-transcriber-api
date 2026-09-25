import type { FastifyReply, FastifyRequest } from 'fastify'
import { EntityNotFoundException } from '@shared/exceptions/entity-not-found.exception'
import type { DeleteTranscriptionByVideoIdUseCase } from '@features/transcriptions/application/delete-transcription-by-video-id.use-case'

export class DeleteTranscriptionByVideoIdHandler {
  constructor(
    private readonly deleteTranscriptionByVideoIdUseCase: DeleteTranscriptionByVideoIdUseCase,
  ) {}

  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params

    try {
      await this.deleteTranscriptionByVideoIdUseCase.execute({ videoId: id })

      return reply.send({
        status: 'success',
        message: 'Transcrição excluída com sucesso!',
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