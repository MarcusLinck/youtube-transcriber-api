import { Agent } from '@mastra/core/agent'
import { google } from '@ai-sdk/google'
import type { MastraModelConfig } from '@mastra/core/llm'
import { fetchYoutubeTranscriptTool } from './youtube-transcript-tool.ts'

const transcriptionModel = google(
  process.env.GEMINI_TRANSCRIPTION_MODEL ?? 'gemini-3.6-flash',
) as unknown as MastraModelConfig

const transcriptionAgent = new Agent({
  id: 'video-transcriber',
  name: 'Transcritor de Vídeos',
  instructions:
    'Você é um especialista em transcrição de vídeos do YouTube. ' +
    'Sempre que precisar do conteúdo de um vídeo, utilize a ferramenta fetch-youtube-transcript para ' +
    'obter a transcrição bruta das legendas. Em seguida, reescreva esse conteúdo em português do Brasil (pt-BR), ' +
    'de forma clara, objetiva e bem formatada: organize o texto em parágrafos e seções quando fizer sentido, ' +
    'corrija a pontuação, preservando todo o conteúdo falado, sem resumir, omitir ou inventar trechos.',
  tools: {
    'fetch-youtube-transcript': fetchYoutubeTranscriptTool,
  },
  model: transcriptionModel,
})

export async function generateVideoTranscription(youtubeUrl: string): Promise<string> {
  const result = await transcriptionAgent.generate(
    'Use a ferramenta fetch-youtube-transcript para obter a transcrição bruta do vídeo do YouTube abaixo e, ' +
      'em seguida, reescreva-a de forma clara, objetiva e bem formatada em português do Brasil (pt-BR):\n\n' +
      youtubeUrl,
  )

  return result.text
}