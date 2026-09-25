import { z } from 'zod'

export const createVideoBodySchema = z.object({
  url: z
    .string()
    .min(1, 'A URL é obrigatória.')
    .url('A URL informada é inválida.')
    .describe('URL pública completa do vídeo do YouTube.'),
})

export const videoParamsSchema = z.object({
  id: z.string().min(1, 'O id do vídeo é obrigatório.'),
})

export const videoSchema = z.object({
  id: z.string().describe('Identificador único (nanoid) do vídeo.'),
  youtube_url: z.string().describe('URL pública completa do vídeo do YouTube.'),
  youtube_id: z.string().describe('Identificador do vídeo extraído da URL.'),
  created_at: z.date().describe('Data e hora de criação do registro.'),
  updated_at: z.date().describe('Data e hora da última atualização do registro.'),
})

export const createVideoResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  video: videoSchema,
})

export const listVideosResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  videos: z.array(videoSchema),
})

export const getVideoResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  video: videoSchema,
})

export const notFoundErrorSchema = z.object({
  status: z.string(),
  message: z.string(),
})

export const validationErrorSchema = z.object({
  status: z.string(),
  message: z.string(),
  issues: z.array(z.any()).describe('Detalhes dos erros de validação.'),
})