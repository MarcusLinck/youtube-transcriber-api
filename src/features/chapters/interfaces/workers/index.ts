import { createWorker } from '@shared/lib/queue'
import { db } from '@shared/db'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository.interface'
import { VideosPostgresRepository } from '@features/videos/infrastructure/storage/videos-postgres-repository'
import { generateVideoChapters } from '../../chapters-agent.ts'
import type { IChaptersRepository } from '../../infrastructure/storage/chapters-repository.interface.ts'
import { ChaptersPostgresRepository } from '../../infrastructure/storage/chapters-postgres-repository.ts'
import { CreateChaptersUseCase } from '../../application/create-chapters.use-case.ts'
import { CHAPTERS_QUEUE, type ChaptersJobData } from '../../chapter-queue.ts'

export interface StartChapterWorkerOptions {
  videosRepository?: IVideosRepository
  chaptersRepository?: IChaptersRepository
  generateChapters?: (youtubeUrl: string) => Promise<string>
}

export function startChapterWorker(options: StartChapterWorkerOptions = {}) {
  const videosRepository = options.videosRepository ?? new VideosPostgresRepository(db)
  const chaptersRepository = options.chaptersRepository ?? new ChaptersPostgresRepository(db)
  const generateChapters = options.generateChapters ?? generateVideoChapters

  const createChaptersUseCase = new CreateChaptersUseCase(
    videosRepository,
    chaptersRepository,
    generateChapters,
  )

  return createWorker<ChaptersJobData>(CHAPTERS_QUEUE, async (job) => {
    await createChaptersUseCase.execute({ videoId: job.data.videoId })
  })
}