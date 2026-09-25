import type { UseCase } from '@shared/contracts/use-case'
import { EntityNotFoundException } from '@shared/exceptions/entity-not-found.exception'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository.interface'
import type { IChaptersRepository } from '@features/chapters/infrastructure/storage/chapters-repository.interface'
import type {
  GetChaptersByVideoIdDTO,
  ReturnFoundChapterDTO,
} from '@features/chapters/application/dtos'
import { chapterToDTO } from '@features/chapters/application/dtos'

export class GetChaptersByVideoIdUseCase
  implements UseCase<GetChaptersByVideoIdDTO, ReturnFoundChapterDTO> {
  constructor(
    private readonly videosRepository: IVideosRepository,
    private readonly chaptersRepository: IChaptersRepository,
  ) {}

  async execute(input: GetChaptersByVideoIdDTO): Promise<ReturnFoundChapterDTO> {
    const video = await this.videosRepository.getVideoById(input.videoId)

    if (!video) {
      throw new EntityNotFoundException('Vídeo não encontrado.')
    }

    const chapter = await this.chaptersRepository.getVideoChaptersByVideoId(input.videoId)

    if (!chapter) {
      throw new EntityNotFoundException('Capítulos não encontrados.')
    }

    return chapterToDTO(chapter)
  }
}