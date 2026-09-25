import { desc, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '@shared/db/schema'
import type { IVideosRepository } from '@features/videos/infrastructure/storage/videos-repository.interface'
import { Video } from '@features/videos/domain/video'

export class VideosPostgresRepository implements IVideosRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async createVideo(video: Video): Promise<void> {
    await this.db.insert(schema.videos).values({
      id: video.id,
      youtube_url: video.youtube_url,
      youtube_id: video.youtube_id,
      created_at: video.created_at,
      updated_at: video.updated_at,
    })
  }

  async listVideos(): Promise<Video[]> {
    const videos = await this.db.select().from(schema.videos).orderBy(desc(schema.videos.created_at))

    return videos.map((row) => Video.toEntity(row))
  }

  async getVideoById(id: string): Promise<Video | undefined> {
    const [row] = await this.db.select().from(schema.videos).where(eq(schema.videos.id, id))

    if (!row) return undefined

    return Video.toEntity(row)
  }
}