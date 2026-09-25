import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod'
import type { IUsersRepository } from '@features/users/infrastructure/storage/users-repository.interface'
import type { ISessionsRepository } from '@features/users/infrastructure/storage/sessions-repository.interface'
import { SignUpUseCase } from '@features/users/application/sign-up.use-case'
import { SignInUseCase } from '@features/users/application/sign-in.use-case'
import { RefreshTokenUseCase } from '@features/users/application/refresh-token.use-case'
import { ConfirmAccountUseCase } from '@features/users/application/confirm-account.use-case'
import { SignOutUseCase } from '@features/users/application/sign-out.use-case'
import { SignUpHandler } from './sign-up.handler.ts'
import { SignInHandler } from './sign-in.handler.ts'
import { RefreshTokenHandler } from './refresh-token.handler.ts'
import { ConfirmAccountHandler } from './confirm-account.handler.ts'
import { SignOutHandler } from './sign-out.handler.ts'
import {
  signUpBodySchema,
  signUpResponseSchema,
  signInBodySchema,
  signInResponseSchema,
  refreshTokenBodySchema,
  refreshTokenResponseSchema,
  confirmAccountBodySchema,
  confirmAccountResponseSchema,
  signOutResponseSchema,
  validationErrorSchema,
  authErrorSchema,
} from '@features/users/user-schemas'

export interface UsersRoutesOptions {
  usersRepository: IUsersRepository
  sessionsRepository: ISessionsRepository
}

export const usersRoutes: FastifyPluginAsyncZod<UsersRoutesOptions> = async (app, options) => {
  const { usersRepository, sessionsRepository } = options

  const signUpUseCase = new SignUpUseCase(usersRepository)
  const signUpHandler = new SignUpHandler(signUpUseCase)

  const signInUseCase = new SignInUseCase(usersRepository, sessionsRepository)
  const signInHandler = new SignInHandler(signInUseCase)

  const refreshTokenUseCase = new RefreshTokenUseCase(usersRepository, sessionsRepository)
  const refreshTokenHandler = new RefreshTokenHandler(refreshTokenUseCase)

  const confirmAccountUseCase = new ConfirmAccountUseCase(usersRepository)
  const confirmAccountHandler = new ConfirmAccountHandler(confirmAccountUseCase)

  const signOutUseCase = new SignOutUseCase(sessionsRepository)
  const signOutHandler = new SignOutHandler(signOutUseCase)

  app.post(
    '/api/v1/auth/sign-up',
    {
      schema: {
        tags: ['Autenticação'],
        summary: 'Cria uma conta na plataforma',
        body: signUpBodySchema,
        response: {
          201: signUpResponseSchema,
          400: validationErrorSchema,
        },
      },
    },
    async (request, reply) => signUpHandler.handle(request, reply),
  )

  app.post(
    '/api/v1/auth/sign-in',
    {
      schema: {
        tags: ['Autenticação'],
        summary: 'Autentica um usuário na plataforma',
        body: signInBodySchema,
        response: {
          200: signInResponseSchema,
          400: validationErrorSchema,
          403: authErrorSchema,
        },
      },
    },
    async (request, reply) => signInHandler.handle(request, reply),
  )

  app.post(
    '/api/v1/auth/confirm',
    {
      schema: {
        tags: ['Autenticação'],
        summary: 'Confirma a conta de um usuário através do token recebido no e-mail',
        body: confirmAccountBodySchema,
        response: {
          200: confirmAccountResponseSchema,
          400: validationErrorSchema,
          404: authErrorSchema,
        },
      },
    },
    async (request, reply) => confirmAccountHandler.handle(request, reply),
  )

  app.post(
    '/api/v1/auth/sign-out',
    {
      schema: {
        tags: ['Autenticação'],
        summary: 'Encerra a sessão ativa do usuário autenticado',
        response: {
          200: signOutResponseSchema,
          401: authErrorSchema,
        },
      },
    },
    async (request, reply) => signOutHandler.handle(request, reply),
  )

  app.post(
    '/api/v1/auth/refresh-token',
    {
      schema: {
        tags: ['Autenticação'],
        summary: 'Renova o token de acesso utilizando o refresh token',
        body: refreshTokenBodySchema,
        response: {
          200: refreshTokenResponseSchema,
          400: validationErrorSchema,
          401: authErrorSchema,
        },
      },
    },
    async (request, reply) => refreshTokenHandler.handle(request, reply),
  )
}