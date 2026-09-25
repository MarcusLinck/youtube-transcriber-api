import type { UseCase } from '@shared/contracts/use-case'
import { EntityNotFoundException } from '@shared/exceptions/entity-not-found.exception'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository.interface'
import type { ITranscriptionsRepository } from '@features/transcriptions/infrastructure/storage/transcriptions-repository.interface'
import type { DeleteTranscriptionByVideoIdDTO } from '@features/transcriptions/application/dtos'

export class DeleteTranscriptionByVideoIdUseCase
  implements UseCase<DeleteTranscriptionByVideoIdDTO, void> {
  constructor(
    private readonly videosRepository: IVideosRepository,
    private readonly transcriptionsRepository: ITranscriptionsRepository,
  ) {}

  async execute(input: DeleteTranscriptionByVideoIdDTO): Promise<void> {
    const video = await this.videosRepository.getVideoById(input.videoId)

    if (!video) {
      throw new EntityNotFoundException('Vídeo não encontrado.')
    }

    const transcription =
      await this.transcriptionsRepository.getVideoTranscriptionByVideoId(input.videoId)

    if (!transcription) {
      throw new EntityNotFoundException('Transcrição não encontrada.')
    }

    await this.transcriptionsRepository.deleteVideoTranscriptionByVideoId(input.videoId)
  }
}