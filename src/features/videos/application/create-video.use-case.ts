import type { Queue } from 'bullmq'
import type { UseCase } from '@shared/contracts/use-case'
import { extractYoutubeId } from '@shared/lib/youtube'
import { Video } from '@features/videos/domain/video'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository.interface'
import type { CreateVideoDTO, ReturnCreatedVideoDTO } from '@features/videos/application/dtos'
import { videoToDTO } from '@features/videos/application/dtos'
import type { TranscriptionJobData } from '@features/transcriptions/transcription-queue'
import type { ChaptersJobData } from '@features/chapters/chapter-queue'

export class CreateVideoUseCase implements UseCase<CreateVideoDTO, ReturnCreatedVideoDTO> {
  constructor(
    private readonly videosRepository: IVideosRepository,
    private readonly transcriptionQueue: Queue<TranscriptionJobData>,
    private readonly chaptersQueue: Queue<ChaptersJobData>,
  ) {}

  async execute(input: CreateVideoDTO): Promise<ReturnCreatedVideoDTO> {
    const youtubeId = extractYoutubeId(input.url) ?? ''

    const video = Video.create({
      youtube_url: input.url,
      youtube_id: youtubeId,
    })

    await this.videosRepository.createVideo(video)

    const jobData = {
      videoId: video.id,
      youtubeUrl: video.youtube_url,
    }

    await Promise.all([
      this.transcriptionQueue.add('generate-transcription', jobData),
      this.chaptersQueue.add('generate-chapters', jobData),
    ])

    return videoToDTO(video)
  }
}
