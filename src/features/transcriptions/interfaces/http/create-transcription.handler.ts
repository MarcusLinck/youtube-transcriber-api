import type { FastifyReply, FastifyRequest } from 'fastify'
import { EntityAlreadyExistsException } from '@shared/exceptions/entity-already-exists.exception'
import { EntityNotFoundException } from '@shared/exceptions/entity-not-found.exception'
import type { CreateTranscriptionUseCase } from '@features/transcriptions/application/create-transcription.use-case'

export class CreateTranscriptionHandler {
  constructor(private readonly createTranscriptionUseCase: CreateTranscriptionUseCase) {}

  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params

    try {
      const transcription = await this.createTranscriptionUseCase.execute({ videoId: id })

      return reply.status(201).send({
        status: 'success',
        message: 'Transcrição criada com sucesso!',
        transcription,
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