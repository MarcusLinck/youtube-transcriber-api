import type { Video } from '@features/videos/domain/video'

export interface CreateVideoDTO {
  url: string
}

export interface VideoDTO {
  id: string
  youtube_url: string
  youtube_id: string
  created_at: Date
  updated_at: Date
}

export type ReturnCreatedVideoDTO = VideoDTO

export type ReturnListedVideosDTO = VideoDTO[]

export interface GetVideoByIdDTO {
  id: string
}

export type ReturnFoundVideoDTO = VideoDTO

export function videoToDTO(video: Video): VideoDTO {
  return {
    id: video.id,
    youtube_url: video.youtube_url,
    youtube_id: video.youtube_id,
    created_at: video.created_at,
    updated_at: video.updated_at,
  }
}