import { and, eq, isNull } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '@shared/db/schema'
import type { ITranscriptionsRepository } from '@features/transcriptions/infrastructure/storage/transcriptions-repository.interface'
import { Transcription } from '@features/transcriptions/domain/transcription'

export class TranscriptionsPostgresRepository implements ITranscriptionsRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async createVideoTranscription(transcription: Transcription): Promise<void> {
    await this.db.insert(schema.videoTranscriptions).values({
      id: transcription.id,
      video_id: transcription.video_id,
      content: transcription.content,
      created_at: transcription.created_at,
      deleted_at: transcription.deleted_at,
      updated_at: transcription.updated_at,
    })
  }

  async getVideoTranscriptionByVideoId(
    videoId: string,
  ): Promise<Transcription | undefined> {
    const [row] = await this.db
      .select()
      .from(schema.videoTranscriptions)
      .where(
        and(
          eq(schema.videoTranscriptions.video_id, videoId),
          isNull(schema.videoTranscriptions.deleted_at),
        ),
      )

    if (!row) return undefined

    return Transcription.toEntity(row)
  }

  async deleteVideoTranscriptionByVideoId(videoId: string): Promise<void> {
    const now = new Date()

    await this.db
      .update(schema.videoTranscriptions)
      .set({ deleted_at: now, updated_at: now })
      .where(
        and(
          eq(schema.videoTranscriptions.video_id, videoId),
          isNull(schema.videoTranscriptions.deleted_at),
        ),
      )
  }
}