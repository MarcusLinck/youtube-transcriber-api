import type { Chapter } from '@features/chapters/domain/chapter'

export interface IChaptersRepository {
  createVideoChapter(chapter: Chapter): Promise<void>
  getVideoChaptersByVideoId(videoId: string): Promise<Chapter | undefined>
  deleteVideoChaptersByVideoId(videoId: string): Promise<void>
}