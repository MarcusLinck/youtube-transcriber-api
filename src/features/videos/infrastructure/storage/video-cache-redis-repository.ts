import Redis from 'ioredis'
import type { IVideoCacheRepository } from '@features/videos/infrastructure/storage/video-cache-repository.interface'
import type { VideoDTO } from '@features/videos/application/dtos'

interface VideoCacheStoredData {
  id: string
  youtube_url: string
  youtube_id: string
  created_at: string
  updated_at: string
}

const VIDEO_CACHE_KEY_PREFIX = 'video'
const VIDEO_CACHE_TTL_SECONDS = 86400

const videoCacheKey = (id: string): string => `${VIDEO_CACHE_KEY_PREFIX}:${id}`

export class VideoCacheRedisRepository implements IVideoCacheRepository {
  constructor(private readonly client: Redis) {}

  async get(id: string): Promise<VideoDTO | null> {
    const raw = await this.client.get(videoCacheKey(id))

    if (!raw) return null

    const data = JSON.parse(raw) as VideoCacheStoredData

    return {
      id: data.id,
      youtube_url: data.youtube_url,
      youtube_id: data.youtube_id,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    }
  }

  async set(id: string, data: VideoDTO): Promise<void> {
    const stored: VideoCacheStoredData = {
      id: data.id,
      youtube_url: data.youtube_url,
      youtube_id: data.youtube_id,
      created_at: data.created_at.toISOString(),
      updated_at: data.updated_at.toISOString(),
    }

    await this.client.set(
      videoCacheKey(id),
      JSON.stringify(stored),
      'EX',
      VIDEO_CACHE_TTL_SECONDS,
    )
  }
}