import type { UseCase } from '@shared/contracts/use-case'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository.interface'
import type { ReturnListedVideosDTO } from '@features/videos/application/dtos'
import { videoToDTO } from '@features/videos/application/dtos'

export class ListVideosUseCase implements UseCase<void, ReturnListedVideosDTO> {
  constructor(private readonly videosRepository: IVideosRepository) {}

  async execute(): Promise<ReturnListedVideosDTO> {
    const videos = await this.videosRepository.listVideos()

    return videos.map((video) => videoToDTO(video))
  }
}