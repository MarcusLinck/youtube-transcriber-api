import { z } from 'zod'

export const videoParamsSchema = z.object({
  id: z.string().min(1, 'O id do vídeo é obrigatório.'),
})

export const videoTranscriptionSchema = z.object({
  id: z.string().describe('Identificador único (nanoid) da transcrição.'),
  video_id: z.string().describe('Identificador do vídeo ao qual a transcrição pertence.'),
  content: z.string().describe('Conteúdo transcrito do vídeo.'),
  created_at: z.date().describe('Data e hora de criação do registro.'),
  deleted_at: z.date().nullable().describe('Data e hora de exclusão lógica, se houver.'),
  updated_at: z.date().describe('Data e hora da última atualização do registro.'),
})

export const createVideoTranscriptionResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  transcription: videoTranscriptionSchema,
})

export const getVideoTranscriptionResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  transcription: videoTranscriptionSchema,
})

export const successResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
})

export const notFoundErrorSchema = z.object({
  status: z.string(),
  message: z.string(),
})

export const conflictErrorSchema = z.object({
  status: z.string(),
  message: z.string(),
})