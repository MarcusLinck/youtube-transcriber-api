import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import apiReference from '@scalar/fastify-api-reference'
import { DrizzleQueryError } from 'drizzle-orm/errors'
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from '@fastify/type-provider-zod'
import type { ZodTypeProvider } from '@fastify/type-provider-zod'
import { videoRoutes } from '@features/videos/interfaces/http/videos.routes'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository.interface'
import { VideosPostgresRepository } from '@features/videos/infrastructure/storage/videos-postgres-repository'
import type { IVideoCacheRepository } from '@features/videos/infrastructure/storage/video-cache-repository.interface'
import { VideoCacheRedisRepository } from '@features/videos/infrastructure/storage/video-cache-redis-repository'
import { videoTranscriptionRoutes } from '@features/transcriptions/interfaces/http/transcriptions.routes'
import type { ITranscriptionsRepository } from '@features/transcriptions/infrastructure/storage/transcriptions-repository.interface'
import { TranscriptionsPostgresRepository } from '@features/transcriptions/infrastructure/storage/transcriptions-postgres-repository'
import { videoChapterRoutes } from '@features/chapters/interfaces/http/chapters.routes'
import type { IChaptersRepository } from '@features/chapters/infrastructure/storage/chapters-repository.interface'
import { ChaptersPostgresRepository } from '@features/chapters/infrastructure/storage/chapters-postgres-repository'
import { usersRoutes } from '@features/users/interfaces/http/users.routes'
import type { IUsersRepository } from '@features/users/infrastructure/storage/users-repository.interface'
import { UsersPostgresRepository } from '@features/users/infrastructure/storage/users-postgres-repository'
import type { ISessionsRepository } from '@features/users/infrastructure/storage/sessions-repository.interface'
import { SessionsRedisRepository } from '@features/users/infrastructure/storage/sessions-redis-repository'
import { authenticate } from '@shared/middlewares/authenticate'
import { db } from '@shared/db'
import { createRedis } from '@shared/lib/redis'
import { createQueue } from '@shared/lib/queue'
import { TRANSCRIPTIONS_QUEUE, type TranscriptionJobData } from '@features/transcriptions/transcription-queue'
import { CHAPTERS_QUEUE, type ChaptersJobData } from '@features/chapters/chapter-queue'

const DRIZZLE_PG_ERROR_MAP: Record<string, { statusCode: number; message: string }> = {
  '23502': { statusCode: 400, message: 'Um campo obrigatório não foi informado.' },
  '23503': { statusCode: 409, message: 'O registro referenciado não existe.' },
  '23505': { statusCode: 409, message: 'Já existe um registro com esses dados.' },
  '23514': { statusCode: 422, message: 'O registro viola uma restrição de validação do banco.' },
  '22P02': { statusCode: 400, message: 'Um valor enviado possui tipo inválido.' },
}

export interface BuildAppOptions {
  logger?: boolean
  generateTranscription?: (youtubeUrl: string) => Promise<string>
  generateChapters?: (youtubeUrl: string) => Promise<string>
  repositories?: {
    usersRepository?: IUsersRepository
    sessionsRepository?: ISessionsRepository
    videosRepository?: IVideosRepository
    videoCacheRepository?: IVideoCacheRepository
    videoTranscriptionsRepository?: ITranscriptionsRepository
    videoChaptersRepository?: IChaptersRepository
  }
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  const redis = createRedis()

  const transcriptionQueue = createQueue<TranscriptionJobData>(TRANSCRIPTIONS_QUEUE)
  const chaptersQueue = createQueue<ChaptersJobData>(CHAPTERS_QUEUE)

  const usersRepository = options.repositories?.usersRepository ?? new UsersPostgresRepository(db)
  const sessionsRepository =
    options.repositories?.sessionsRepository ?? new SessionsRedisRepository(redis)
  const videosRepository =
    options.repositories?.videosRepository ?? new VideosPostgresRepository(db)
  const videoCacheRepository =
    options.repositories?.videoCacheRepository ?? new VideoCacheRedisRepository(redis)
  const videoTranscriptionsRepository =
    options.repositories?.videoTranscriptionsRepository ?? new TranscriptionsPostgresRepository(db)
  const videoChaptersRepository =
    options.repositories?.videoChaptersRepository ?? new ChaptersPostgresRepository(db)

  app.addHook('onClose', async () => {
    await Promise.all([
      redis.quit(),
      transcriptionQueue.close(),
      chaptersQueue.close(),
    ])
  })

  authenticate(app, sessionsRepository)

  app.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'API de Vídeos',
        description: 'API responsável por gerenciar vídeos do YouTube.',
        version: '1.0.0',
      },
      servers: [{ url: 'http://localhost:3333' }],
    },
    transform: jsonSchemaTransform,
  })

  app.register(apiReference, {
    routePrefix: '/docs',
  })

  app.setErrorHandler((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        status: 'error',
        message: 'Requisição inválida, verifique os dados enviados.',
        issues: error.validation,
      })
    }

    if (isResponseSerializationError(error)) {
      return reply.status(500).send({
        status: 'error',
        message: 'Erro interno ao processar a resposta.',
      })
    }

    if (error instanceof DrizzleQueryError) {
      const pgError = error.cause as
        | { code?: string; constraint?: string; detail?: string; message?: string }
        | undefined

      const mappedError = pgError?.code ? DRIZZLE_PG_ERROR_MAP[pgError.code] : undefined

      request.log.error(error, 'Erro ao executar query no banco de dados')

      return reply.status(mappedError?.statusCode ?? 500).send({
        status: 'error',
        message: mappedError?.message ?? 'Erro ao consultar o banco de dados.',
        details: {
          code: pgError?.code,
          constraint: pgError?.constraint,
          detail: pgError?.detail,
          message: pgError?.message ?? error.message,
          query: error.query,
        },
      })
    }

    request.log.error(error)

    return reply.status(500).send({
      status: 'error',
      message: 'Erro interno do servidor.',
    })
  })

  app.get('/', async () => {
    return { status: 'success', message: 'API rodando com sucesso!' }
  })

  const appWithZod = app.withTypeProvider<ZodTypeProvider>()

  appWithZod.register(usersRoutes, {
    usersRepository,
    sessionsRepository,
  })
  appWithZod.register(videoRoutes, {
    videosRepository,
    videoCacheRepository,
    transcriptionQueue,
    chaptersQueue,
  })
  appWithZod.register(videoTranscriptionRoutes, {
    videosRepository,
    transcriptionsRepository: videoTranscriptionsRepository,
    generateTranscription: options.generateTranscription,
  })
  appWithZod.register(videoChapterRoutes, {
    videosRepository,
    chaptersRepository: videoChaptersRepository,
    generateChapters: options.generateChapters,
  })

  return appWithZod
}