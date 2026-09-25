import { and, eq, isNull } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '@shared/db/schema'
import type { IChaptersRepository } from '@features/chapters/infrastructure/storage/chapters-repository.interface'
import { Chapter } from '@features/chapters/domain/chapter'

export class ChaptersPostgresRepository implements IChaptersRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async createVideoChapter(chapter: Chapter): Promise<void> {
    await this.db.insert(schema.videoChapters).values({
      id: chapter.id,
      video_id: chapter.video_id,
      content: chapter.content,
      created_at: chapter.created_at,
      deleted_at: chapter.deleted_at,
      updated_at: chapter.updated_at,
    })
  }

  async getVideoChaptersByVideoId(videoId: string): Promise<Chapter | undefined> {
    const [row] = await this.db
      .select()
      .from(schema.videoChapters)
      .where(
        and(eq(schema.videoChapters.video_id, videoId), isNull(schema.videoChapters.deleted_at)),
      )

    if (!row) return undefined

    return Chapter.toEntity(row)
  }

  async deleteVideoChaptersByVideoId(videoId: string): Promise<void> {
    const now = new Date()

    await this.db
      .update(schema.videoChapters)
      .set({ deleted_at: now, updated_at: now })
      .where(
        and(eq(schema.videoChapters.video_id, videoId), isNull(schema.videoChapters.deleted_at)),
      )
  }
}