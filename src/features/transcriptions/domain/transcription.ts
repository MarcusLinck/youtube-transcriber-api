import { nanoid } from 'nanoid'

export interface TranscriptionEntityData {
  id: string
  video_id: string
  content: string
  created_at: Date
  deleted_at: Date | null
  updated_at: Date
}

export interface CreateTranscriptionEntityData {
  video_id: string
  content: string
}

export class Transcription {
  private constructor(private readonly data: TranscriptionEntityData) {}

  static create(data: CreateTranscriptionEntityData): Transcription {
    const now = new Date()

    return new Transcription({
      id: nanoid(),
      video_id: data.video_id,
      content: data.content,
      created_at: now,
      deleted_at: null,
      updated_at: now,
    })
  }

  static toEntity(data: TranscriptionEntityData): Transcription {
    return new Transcription(data)
  }

  get id(): string {
    return this.data.id
  }

  get video_id(): string {
    return this.data.video_id
  }

  get content(): string {
    return this.data.content
  }

  get created_at(): Date {
    return this.data.created_at
  }

  get deleted_at(): Date | null {
    return this.data.deleted_at
  }

  get updated_at(): Date {
    return this.data.updated_at
  }
}