import { z } from 'zod'
import { createTool } from '@mastra/core/tools'
import { fetchYoutubeTranscript } from '@shared/lib/youtube-transcript'

export function formatSecondsToTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const segmentSchema = z.object({
  start: z.string().describe('Instante em que o trecho começa no vídeo, no formato mm:ss.'),
  offset: z.number().describe('Tempo de início do trecho em milissegundos.'),
  duration: z.number().describe('Duração do trecho em milissegundos.'),
  text: z.string().describe('Trecho do texto falado na legenda.'),
})

export const fetchYoutubeTranscriptSegmentsTool = createTool({
  id: 'fetch-youtube-transcript-segments',
  description:
    'Busca os trechos da legenda (texto e timestamp de início) de um vídeo do YouTube. Aceita a URL completa do vídeo ou apenas o ID do vídeo e retorna os trechos em ordem cronológica, cada um com o instante em que começa.',
  inputSchema: z.object({
    url: z
      .string()
      .min(1, 'A URL ou o ID do vídeo do YouTube é obrigatório.'),
  }),
  outputSchema: z.object({
    videoId: z.string().min(11).describe('ID do vídeo do YouTube.'),
    language: z.string().nullable().describe('Idioma da transcrição retornada pelo YouTube.'),
    segments: z.array(segmentSchema).describe('Trechos da legenda em ordem cronológica.'),
  }),
  execute: async ({ url }) => {
    const { videoId, language, segments } = await fetchYoutubeTranscript(url)

    return {
      videoId,
      language,
      segments: segments.map((segment) => ({
        ...segment,
        start: formatSecondsToTimestamp(segment.offset),
      })),
    }
  },
})