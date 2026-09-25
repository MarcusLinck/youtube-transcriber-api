import { Agent } from '@mastra/core/agent'
import { google } from '@ai-sdk/google'
import type { MastraModelConfig } from '@mastra/core/llm'
import { fetchYoutubeTranscriptSegmentsTool } from './youtube-chapters-tool.ts'

const chaptersModel = google(
  process.env.GEMINI_CHAPTERS_MODEL ?? 'gemini-3.6-flash',
) as unknown as MastraModelConfig

const chaptersAgent = new Agent({
  id: 'video-chapters-generator',
  name: 'Gerador de Capítulos de Vídeos',
  instructions:
    'Você é um especialista em estruturar vídeos do YouTube em capítulos. ' +
    'Utilize a ferramenta fetch-youtube-transcript-segments para obter os trechos da legenda com seus ' +
    'respectivos timestamps. Analise o conteúdo e agrupe os trechos por tópicos, definindo os momentos ' +
    'em que cada tópico começa. ' +
    'Retorne um capítulo por linha, no formato "mm:ss - Título do Capítulo", usando o timestamp ' +
    '(campo start de cada trecho) em que o tópico se inicia. Os capítulos devem estar em português ' +
    'do Brasil (pt-BR), cobrir todo o conteúdo do vídeo de forma fiel e objetiva, e estar em ordem ' +
    'cronológica. Não invente tópicos nem traduza nomes próprios de forma indevida.',
  tools: {
    'fetch-youtube-transcript-segments': fetchYoutubeTranscriptSegmentsTool,
  },
  model: chaptersModel,
})

export async function generateVideoChapters(youtubeUrl: string): Promise<string> {
  const result = await chaptersAgent.generate(
    'Use a ferramenta fetch-youtube-transcript-segments para obter os trechos da legenda do vídeo do ' +
      'YouTube abaixo e, em seguida, gere os capítulos do vídeo:\n\n' +
      youtubeUrl,
  )

  return result.text
}