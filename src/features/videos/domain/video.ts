import { nanoid } from 'nanoid'

export interface VideoEntityData {
  id: string
  youtube_url: string
  youtube_id: string
  created_at: Date
  updated_at: Date
}

export interface CreateVideoEntityData {
  youtube_url: string
  youtube_id: string
}

export class Video {
  private constructor(private readonly data: VideoEntityData) {}

  static create(data: CreateVideoEntityData): Video {
    const now = new Date()

    return new Video({
      id: nanoid(),
      youtube_url: data.youtube_url,
      youtube_id: data.youtube_id,
      created_at: now,
      updated_at: now,
    })
  }

  static toEntity(data: VideoEntityData): Video {
    return new Video(data)
  }

  get id(): string {
    return this.data.id
  }

  get youtube_url(): string {
    return this.data.youtube_url
  }

  get youtube_id(): string {
    return this.data.youtube_id
  }

  get created_at(): Date {
    return this.data.created_at
  }

  get updated_at(): Date {
    return this.data.updated_at
  }
}