import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod'
import { generateVideoTranscription } from '@features/transcriptions/transcription-agent'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository.interface'
import type { ITranscriptionsRepository } from '@features/transcriptions/infrastructure/storage/transcriptions-repository.interface'
import { CreateTranscriptionUseCase } from '@features/transcriptions/application/create-transcription.use-case'
import { GetTranscriptionByVideoIdUseCase } from '@features/transcriptions/application/get-transcription-by-video-id.use-case'
import { DeleteTranscriptionByVideoIdUseCase } from '@features/transcriptions/application/delete-transcription-by-video-id.use-case'
import { CreateTranscriptionHandler } from './create-transcription.handler.ts'
import { GetTranscriptionByVideoIdHandler } from './get-transcription-by-video-id.handler.ts'
import { DeleteTranscriptionByVideoIdHandler } from './delete-transcription-by-video-id.handler.ts'
import {
  conflictErrorSchema,
  createVideoTranscriptionResponseSchema,
  getVideoTranscriptionResponseSchema,
  notFoundErrorSchema,
  successResponseSchema,
  videoParamsSchema,
} from '@features/transcriptions/video-transcription-schemas'

export interface VideoTranscriptionRoutesOptions {
  videosRepository: IVideosRepository
  transcriptionsRepository: ITranscriptionsRepository
  generateTranscription?: (youtubeUrl: string) => Promise<string>
}

export const videoTranscriptionRoutes: FastifyPluginAsyncZod<VideoTranscriptionRoutesOptions> =
  async (app, options) => {
    const { videosRepository, transcriptionsRepository } = options
    const generateTranscription = options.generateTranscription ?? generateVideoTranscription

    const createTranscriptionUseCase = new CreateTranscriptionUseCase(
      videosRepository,
      transcriptionsRepository,
      generateTranscription,
    )
    const getTranscriptionByVideoIdUseCase = new GetTranscriptionByVideoIdUseCase(
      videosRepository,
      transcriptionsRepository,
    )
    const deleteTranscriptionByVideoIdUseCase = new DeleteTranscriptionByVideoIdUseCase(
      videosRepository,
      transcriptionsRepository,
    )

    const createTranscriptionHandler = new CreateTranscriptionHandler(createTranscriptionUseCase)
    const getTranscriptionByVideoIdHandler = new GetTranscriptionByVideoIdHandler(
      getTranscriptionByVideoIdUseCase,
    )
    const deleteTranscriptionByVideoIdHandler = new DeleteTranscriptionByVideoIdHandler(
      deleteTranscriptionByVideoIdUseCase,
    )

    app.post(
      '/api/v1/videos/:id/transcriptions',
      {
        schema: {
          tags: ['Transcrições'],
          summary: 'Gera a transcrição de um vídeo do YouTube',
          params: videoParamsSchema,
          response: {
            201: createVideoTranscriptionResponseSchema,
            404: notFoundErrorSchema,
            409: conflictErrorSchema,
          },
        },
      },
      async (request, reply) => createTranscriptionHandler.handle(request, reply),
    )

    app.get(
      '/api/v1/videos/:id/transcriptions',
      {
        schema: {
          tags: ['Transcrições'],
          summary: 'Retorna a transcrição de um vídeo pelo id',
          params: videoParamsSchema,
          response: {
            200: getVideoTranscriptionResponseSchema,
            404: notFoundErrorSchema,
          },
        },
      },
      async (request, reply) => getTranscriptionByVideoIdHandler.handle(request, reply),
    )

    app.delete(
      '/api/v1/videos/:id/transcriptions',
      {
        schema: {
          tags: ['Transcrições'],
          summary: 'Exclui a transcrição de um vídeo pelo id',
          params: videoParamsSchema,
          response: {
            200: successResponseSchema,
            404: notFoundErrorSchema,
          },
        },
      },
      async (request, reply) => deleteTranscriptionByVideoIdHandler.handle(request, reply),
    )
  }