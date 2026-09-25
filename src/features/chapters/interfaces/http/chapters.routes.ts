import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod'
import { generateVideoChapters } from '@features/chapters/chapters-agent'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository.interface'
import type { IChaptersRepository } from '@features/chapters/infrastructure/storage/chapters-repository.interface'
import { CreateChaptersUseCase } from '@features/chapters/application/create-chapters.use-case'
import { GetChaptersByVideoIdUseCase } from '@features/chapters/application/get-chapters-by-video-id.use-case'
import { DeleteChaptersByVideoIdUseCase } from '@features/chapters/application/delete-chapters-by-video-id.use-case'
import { CreateChaptersHandler } from './create-chapters.handler.ts'
import { GetChaptersByVideoIdHandler } from './get-chapters-by-video-id.handler.ts'
import { DeleteChaptersByVideoIdHandler } from './delete-chapters-by-video-id.handler.ts'
import {
  conflictErrorSchema,
  createVideoChapterResponseSchema,
  getVideoChapterResponseSchema,
  notFoundErrorSchema,
  successResponseSchema,
  videoParamsSchema,
} from '@features/chapters/video-chapter-schemas'

export interface VideoChapterRoutesOptions {
  videosRepository: IVideosRepository
  chaptersRepository: IChaptersRepository
  generateChapters?: (youtubeUrl: string) => Promise<string>
}

export const videoChapterRoutes: FastifyPluginAsyncZod<VideoChapterRoutesOptions> = async (
  app,
  options,
) => {
  const { videosRepository, chaptersRepository } = options
  const generateChapters = options.generateChapters ?? generateVideoChapters

  const createChaptersUseCase = new CreateChaptersUseCase(
    videosRepository,
    chaptersRepository,
    generateChapters,
  )
  const getChaptersByVideoIdUseCase = new GetChaptersByVideoIdUseCase(
    videosRepository,
    chaptersRepository,
  )
  const deleteChaptersByVideoIdUseCase = new DeleteChaptersByVideoIdUseCase(
    videosRepository,
    chaptersRepository,
  )

  const createChaptersHandler = new CreateChaptersHandler(createChaptersUseCase)
  const getChaptersByVideoIdHandler = new GetChaptersByVideoIdHandler(getChaptersByVideoIdUseCase)
  const deleteChaptersByVideoIdHandler = new DeleteChaptersByVideoIdHandler(
    deleteChaptersByVideoIdUseCase,
  )

  app.post(
    '/api/v1/videos/:id/chapters',
    {
      schema: {
        tags: ['Capítulos'],
        summary: 'Gera os capítulos de um vídeo do YouTube',
        params: videoParamsSchema,
        response: {
          201: createVideoChapterResponseSchema,
          404: notFoundErrorSchema,
          409: conflictErrorSchema,
        },
      },
    },
    async (request, reply) => createChaptersHandler.handle(request, reply),
  )

  app.get(
    '/api/v1/videos/:id/chapters',
    {
      schema: {
        tags: ['Capítulos'],
        summary: 'Retorna os capítulos de um vídeo pelo id',
        params: videoParamsSchema,
        response: {
          200: getVideoChapterResponseSchema,
          404: notFoundErrorSchema,
        },
      },
    },
    async (request, reply) => getChaptersByVideoIdHandler.handle(request, reply),
  )

  app.delete(
    '/api/v1/videos/:id/chapters',
    {
      schema: {
        tags: ['Capítulos'],
        summary: 'Exclui os capítulos de um vídeo pelo id',
        params: videoParamsSchema,
        response: {
          200: successResponseSchema,
          404: notFoundErrorSchema,
        },
      },
    },
    async (request, reply) => deleteChaptersByVideoIdHandler.handle(request, reply),
  )
}