import type { VideoDTO } from '@features/videos/application/dtos'

export interface IVideoCacheRepository {
  get(id: string): Promise<VideoDTO | null>
  set(id: string, data: VideoDTO): Promise<void>
}