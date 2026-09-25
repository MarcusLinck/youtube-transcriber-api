import type { UseCase } from '@shared/contracts/use-case'
import { EntityNotFoundException } from '@shared/exceptions/entity-not-found.exception'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository.interface'
import type { IVideoCacheRepository } from '@features/videos/infrastructure/storage/video-cache-repository.interface'
import type { GetVideoByIdDTO, ReturnFoundVideoDTO } from '@features/videos/application/dtos'
import { videoToDTO } from '@features/videos/application/dtos'

export class GetVideoByIdUseCase implements UseCase<GetVideoByIdDTO, ReturnFoundVideoDTO> {
  constructor(
    private readonly videosRepository: IVideosRepository,
    private readonly videoCacheRepository: IVideoCacheRepository,
  ) {}

  async execute(input: GetVideoByIdDTO): Promise<ReturnFoundVideoDTO> {
    const cachedVideo = await this.videoCacheRepository.get(input.id)

    if (cachedVideo) {
      return cachedVideo
    }

    const video = await this.videosRepository.getVideoById(input.id)

    if (!video) {
      throw new EntityNotFoundException('Vídeo não encontrado.')
    }

    const foundVideo = videoToDTO(video)

    await this.videoCacheRepository.set(input.id, foundVideo)

    return foundVideo
  }
}