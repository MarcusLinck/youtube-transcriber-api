import type { Chapter } from '@features/chapters/domain/chapter'

export interface CreateChapterDTO {
  videoId: string
}

export interface ChapterDTO {
  id: string
  video_id: string
  content: string
  created_at: Date
  deleted_at: Date | null
  updated_at: Date
}

export type ReturnCreatedChapterDTO = ChapterDTO

export interface GetChaptersByVideoIdDTO {
  videoId: string
}

export type ReturnFoundChapterDTO = ChapterDTO

export interface DeleteChaptersByVideoIdDTO {
  videoId: string
}

export function chapterToDTO(chapter: Chapter): ChapterDTO {
  return {
    id: chapter.id,
    video_id: chapter.video_id,
    content: chapter.content,
    created_at: chapter.created_at,
    deleted_at: chapter.deleted_at,
    updated_at: chapter.updated_at,
  }
}