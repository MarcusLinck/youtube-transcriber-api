import type { Transcription } from '@features/transcriptions/domain/transcription'

export interface CreateTranscriptionDTO {
  videoId: string
}

export interface TranscriptionDTO {
  id: string
  video_id: string
  content: string
  created_at: Date
  deleted_at: Date | null
  updated_at: Date
}

export type ReturnCreatedTranscriptionDTO = TranscriptionDTO

export interface GetTranscriptionByVideoIdDTO {
  videoId: string
}

export type ReturnFoundTranscriptionDTO = TranscriptionDTO

export interface DeleteTranscriptionByVideoIdDTO {
  videoId: string
}

export function transcriptionToDTO(transcription: Transcription): TranscriptionDTO {
  return {
    id: transcription.id,
    video_id: transcription.video_id,
    content: transcription.content,
    created_at: transcription.created_at,
    deleted_at: transcription.deleted_at,
    updated_at: transcription.updated_at,
  }
}