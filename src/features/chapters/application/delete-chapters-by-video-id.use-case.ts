import type { UseCase } from '@shared/contracts/use-case'
import { EntityNotFoundException } from '@shared/exceptions/entity-not-found.exception'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository.interface'
import type { IChaptersRepository } from '@features/chapters/infrastructure/storage/chapters-repository.interface'
import type { DeleteChaptersByVideoIdDTO } from '@features/chapters/application/dtos'

export class DeleteChaptersByVideoIdUseCase
  implements UseCase<DeleteChaptersByVideoIdDTO, void> {
  constructor(
    private readonly videosRepository: IVideosRepository,
    private readonly chaptersRepository: IChaptersRepository,
  ) {}

  async execute(input: DeleteChaptersByVideoIdDTO): Promise<void> {
    const video = await this.videosRepository.getVideoById(input.videoId)

    if (!video) {
      throw new EntityNotFoundException('Vídeo não encontrado.')
    }

    const chapter = await this.chaptersRepository.getVideoChaptersByVideoId(input.videoId)

    if (!chapter) {
      throw new EntityNotFoundException('Capítulos não encontrados.')
    }

    await this.chaptersRepository.deleteVideoChaptersByVideoId(input.videoId)
  }
}