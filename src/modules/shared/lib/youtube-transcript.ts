import { YoutubeTranscript, YoutubeTranscriptError } from 'youtube-transcript'
import { extractYoutubeId } from './youtube.ts'

export interface YoutubeTranscriptSegment {
  text: string
  offset: number
  duration: number
}

export interface FetchYoutubeTranscriptResult {
  videoId: string
  language: string | null
  raw: string
  segments: YoutubeTranscriptSegment[]
}

export async function fetchYoutubeTranscript(input: string): Promise<FetchYoutubeTranscriptResult> {
  const videoId = extractYoutubeId(input) ?? input.trim()

  let parts: Awaited<ReturnType<typeof YoutubeTranscript.fetchTranscript>>

  try {
    parts = await YoutubeTranscript.fetchTranscript(videoId)
  } catch (error) {
    if (error instanceof YoutubeTranscriptError) {
      throw new Error(`Não foi possível obter a transcrição do vídeo (${videoId}): ${error.message}`)
    }

    throw error
  }

  return {
    videoId,
    language: parts[0]?.lang ?? null,
    raw: parts.map((part: { text: string }) => part.text).join(' '),
    segments: parts.map((part: { text: string; offset: number; duration: number }) => ({
      text: part.text,
      offset: part.offset,
      duration: part.duration,
    })),
  }
}