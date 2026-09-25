import type { UseCase } from '@shared/contracts/use-case'
import { EntityAlreadyExistsException } from '@shared/exceptions/entity-already-exists.exception'
import { EntityNotFoundException } from '@shared/exceptions/entity-not-found.exception'
import { Transcription } from '@features/transcriptions/domain/transcription'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository.interface'
import type { ITranscriptionsRepository } from '@features/transcriptions/infrastructure/storage/transcriptions-repository.interface'
import type {
  CreateTranscriptionDTO,
  ReturnCreatedTranscriptionDTO,
} from '@features/transcriptions/application/dtos'
import { transcriptionToDTO } from '@features/transcriptions/application/dtos'

export class CreateTranscriptionUseCase
  implements UseCase<CreateTranscriptionDTO, ReturnCreatedTranscriptionDTO> {
  constructor(
    private readonly videosRepository: IVideosRepository,
    private readonly transcriptionsRepository: ITranscriptionsRepository,
    private readonly generateTranscription: (youtubeUrl: string) => Promise<string>,
  ) {}

  async execute(input: CreateTranscriptionDTO): Promise<ReturnCreatedTranscriptionDTO> {
    const video = await this.videosRepository.getVideoById(input.videoId)

    if (!video) {
      throw new EntityNotFoundException('Vídeo não encontrado.')
    }

    const existingTranscription =
      await this.transcriptionsRepository.getVideoTranscriptionByVideoId(input.videoId)

    if (existingTranscription) {
      throw new EntityAlreadyExistsException('Este vídeo já possui uma transcrição cadastrada.')
    }

    const content = await this.generateTranscription(video.youtube_url)

    const transcription = Transcription.create({
      video_id: video.id,
      content,
    })

    await this.transcriptionsRepository.createVideoTranscription(transcription)

    return transcriptionToDTO(transcription)
  }
}