import { z } from 'zod'
import { createTool } from '@mastra/core/tools'
import { fetchYoutubeTranscript } from '@shared/lib/youtube-transcript'

export const fetchYoutubeTranscriptTool = createTool({
  id: 'fetch-youtube-transcript',
  description:
    'Busca a transcrição bruta (legendas) de um vídeo do YouTube. Aceita a URL completa do vídeo ou apenas o ID do vídeo e retorna o texto falado conforme as legendas disponíveis.',
  inputSchema: z.object({
    url: z
      .string()
      .min(1, 'A URL ou o ID do vídeo do YouTube é obrigatório.'),
  }),
  outputSchema: z.object({
    videoId: z.string().min(11).describe('ID do vídeo do YouTube.'),
    language: z.string().nullable().describe('Idioma da transcrição retornada pelo YouTube.'),
    raw: z.string().describe('Texto bruto da transcrição, sem formatação.'),
  }),
  execute: async ({ url }) => {
    const { videoId, language, raw } = await fetchYoutubeTranscript(url)

    return { videoId, language, raw }
  },
})