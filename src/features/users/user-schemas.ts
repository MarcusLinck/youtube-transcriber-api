import { z } from 'zod'

export const signUpBodySchema = z.object({
  firstName: z.string().min(1, 'O primeiro nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório.')
    .email('O e-mail informado é inválido.'),
  password: z.string().min(1, 'A senha é obrigatória.'),
  confirmPassword: z.string().min(1, 'A confirmação de senha é obrigatória.'),
})

export const signInBodySchema = z.object({
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório.')
    .email('O e-mail informado é inválido.'),
  password: z.string().min(1, 'A senha é obrigatória.'),
})

export const userSchema = z.object({
  id: z.string().describe('Identificador único (nanoid) do usuário.'),
  first_name: z.string().describe('Primeiro nome do usuário.'),
  last_name: z.string().describe('Sobrenome do usuário.'),
  email: z.string().describe('E-mail do usuário.'),
  role: z.enum(['user', 'admin']).describe('Papel do usuário na plataforma.'),
confirmation_token: z
    .string()
    .nullable()
    .describe('Token de confirmação de conta (limpo após a confirmação).'),
  created_at: z.date().describe('Data e hora de criação do registro.'),
  updated_at: z.date().describe('Data e hora da última atualização do registro.'),
  active: z.boolean().describe('Indica se o usuário está ativo na plataforma.'),
})

export const signUpResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  user: userSchema,
})

export const signInResponseSchema = z.object({
  token: z.string().describe('Token JWT de acesso que deve ser enviado nas próximas requisições.'),
  refresh_token: z.string().describe('Token de atualização que permite renovar o acesso.'),
})

export const refreshTokenBodySchema = z.object({
  refresh_token: z.string().min(1, 'O refresh token é obrigatório.'),
})

export const confirmAccountBodySchema = z.object({
  token: z.string().min(1, 'O token de confirmação é obrigatório.'),
})

export const confirmAccountResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
})

export const signOutResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
})

export const refreshTokenResponseSchema = z.object({
  token: z.string().describe('Novo token JWT de acesso que deve ser enviado nas próximas requisições.'),
  refresh_token: z.string().describe('Novo token de atualização que permite renovar o acesso.'),
})

export const validationErrorSchema = z.object({
  status: z.string(),
  message: z.string(),
  issues: z.array(z.any()).describe('Detalhes dos erros de validação.'),
})

export const authErrorSchema = z.object({
  status: z.string(),
  message: z.string(),
})