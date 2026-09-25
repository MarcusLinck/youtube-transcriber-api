import type { Transcription } from '@features/transcriptions/domain/transcription'

export interface ITranscriptionsRepository {
  createVideoTranscription(transcription: Transcription): Promise<void>
  getVideoTranscriptionByVideoId(videoId: string): Promise<Transcription | undefined>
  deleteVideoTranscriptionByVideoId(videoId: string): Promise<void>
}