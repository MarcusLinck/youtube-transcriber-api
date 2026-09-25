import { createWorker } from '@shared/lib/queue'
import { db } from '@shared/db'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository.interface'
import { VideosPostgresRepository } from '@features/videos/infrastructure/storage/videos-postgres-repository'
import { generateVideoTranscription } from '../../transcription-agent.ts'
import type { ITranscriptionsRepository } from '../../infrastructure/storage/transcriptions-repository.interface.ts'
import { TranscriptionsPostgresRepository } from '../../infrastructure/storage/transcriptions-postgres-repository.ts'
import { CreateTranscriptionUseCase } from '../../application/create-transcription.use-case.ts'
import { TRANSCRIPTIONS_QUEUE, type TranscriptionJobData } from '../../transcription-queue.ts'

export interface StartTranscriptionWorkerOptions {
  videosRepository?: IVideosRepository
  transcriptionsRepository?: ITranscriptionsRepository
  generateTranscription?: (youtubeUrl: string) => Promise<string>
}

export function startTranscriptionWorker(options: StartTranscriptionWorkerOptions = {}) {
  const videosRepository = options.videosRepository ?? new VideosPostgresRepository(db)
  const transcriptionsRepository =
    options.transcriptionsRepository ?? new TranscriptionsPostgresRepository(db)
  const generateTranscription = options.generateTranscription ?? generateVideoTranscription

  const createTranscriptionUseCase = new CreateTranscriptionUseCase(
    videosRepository,
    transcriptionsRepository,
    generateTranscription,
  )

  return createWorker<TranscriptionJobData>(TRANSCRIPTIONS_QUEUE, async (job) => {
    await createTranscriptionUseCase.execute({ videoId: job.data.videoId })
  })
}