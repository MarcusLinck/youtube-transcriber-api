import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod'
import type { Queue } from 'bullmq'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository.interface'
import type { IVideoCacheRepository } from '@features/videos/infrastructure/storage/video-cache-repository.interface'
import type { TranscriptionJobData } from '@features/transcriptions/transcription-queue'
import type { ChaptersJobData } from '@features/chapters/chapter-queue'
import { CreateVideoUseCase } from '@features/videos/application/create-video.use-case'
import { ListVideosUseCase } from '@features/videos/application/list-videos.use-case'
import { GetVideoByIdUseCase } from '@features/videos/application/get-video-by-id.use-case'
import { CreateVideoHandler } from './create-video.handler.ts'
import { ListVideosHandler } from './list-videos.handler.ts'
import { GetVideoByIdHandler } from './get-video-by-id.handler.ts'
import {
  createVideoBodySchema,
  createVideoResponseSchema,
  getVideoResponseSchema,
  listVideosResponseSchema,
  notFoundErrorSchema,
  validationErrorSchema,
  videoParamsSchema,
} from '@features/videos/video-schemas'

export interface VideoRoutesOptions {
  videosRepository: IVideosRepository
  videoCacheRepository: IVideoCacheRepository
  transcriptionQueue: Queue<TranscriptionJobData>
  chaptersQueue: Queue<ChaptersJobData>
}

export const videoRoutes: FastifyPluginAsyncZod<VideoRoutesOptions> = async (app, options) => {
  const { videosRepository, videoCacheRepository } = options

  const createVideoUseCase = new CreateVideoUseCase(
    videosRepository,
    options.transcriptionQueue,
    options.chaptersQueue,
  )
  const listVideosUseCase = new ListVideosUseCase(videosRepository)
  const getVideoByIdUseCase = new GetVideoByIdUseCase(
    videosRepository,
    videoCacheRepository,
  )

  const createVideoHandler = new CreateVideoHandler(createVideoUseCase)
  const listVideosHandler = new ListVideosHandler(listVideosUseCase)
  const getVideoByIdHandler = new GetVideoByIdHandler(getVideoByIdUseCase)

  app.post(
    '/api/v1/videos',
    {
      schema: {
        tags: ['Vídeos'],
        summary: 'Cria um vídeo do YouTube',
        body: createVideoBodySchema,
        response: {
          201: createVideoResponseSchema,
          400: validationErrorSchema,
        },
      },
    },
    async (request, reply) => createVideoHandler.handle(request, reply),
  )

  app.get(
    '/api/v1/videos',
    {
      schema: {
        tags: ['Vídeos'],
        summary: 'Lista todos os vídeos criados',
        response: {
          200: listVideosResponseSchema,
        },
      },
    },
    async (request, reply) => listVideosHandler.handle(request, reply),
  )

  app.get(
    '/api/v1/videos/:id',
    {
      schema: {
        tags: ['Vídeos'],
        summary: 'Retorna os detalhes de um vídeo pelo id',
        params: videoParamsSchema,
        response: {
          200: getVideoResponseSchema,
          404: notFoundErrorSchema,
        },
      },
    },
    async (request, reply) => getVideoByIdHandler.handle(request, reply),
  )
}