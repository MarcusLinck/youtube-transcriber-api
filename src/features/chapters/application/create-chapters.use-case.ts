import type { UseCase } from '@shared/contracts/use-case'
import { EntityAlreadyExistsException } from '@shared/exceptions/entity-already-exists.exception'
import { EntityNotFoundException } from '@shared/exceptions/entity-not-found.exception'
import { Chapter } from '@features/chapters/domain/chapter'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository.interface'
import type { IChaptersRepository } from '@features/chapters/infrastructure/storage/chapters-repository.interface'
import type { CreateChapterDTO, ReturnCreatedChapterDTO } from '@features/chapters/application/dtos'
import { chapterToDTO } from '@features/chapters/application/dtos'

export class CreateChaptersUseCase implements UseCase<CreateChapterDTO, ReturnCreatedChapterDTO> {
  constructor(
    private readonly videosRepository: IVideosRepository,
    private readonly chaptersRepository: IChaptersRepository,
    private readonly generateChapters: (youtubeUrl: string) => Promise<string>,
  ) {}

  async execute(input: CreateChapterDTO): Promise<ReturnCreatedChapterDTO> {
    const video = await this.videosRepository.getVideoById(input.videoId)

    if (!video) {
      throw new EntityNotFoundException('Vídeo não encontrado.')
    }

    const existingChapter = await this.chaptersRepository.getVideoChaptersByVideoId(input.videoId)

    if (existingChapter) {
      throw new EntityAlreadyExistsException('Este vídeo já possui capítulos cadastrados.')
    }

    const content = await this.generateChapters(video.youtube_url)

    const chapter = Chapter.create({
      video_id: video.id,
      content,
    })

    await this.chaptersRepository.createVideoChapter(chapter)

    return chapterToDTO(chapter)
  }
}