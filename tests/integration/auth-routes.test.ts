import { test, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { Pool } from 'pg'
import type { FastifyInstance } from 'fastify'
import { createDatabaseIfNotExists, databaseUrl, runMigrations } from '../helpers/test-db.ts'

const DB_NAME = 'videos_test_auth'

process.env.DATABASE_URL = databaseUrl(DB_NAME)

await createDatabaseIfNotExists(DB_NAME)
await runMigrations(DB_NAME)

const { buildApp } = await import('../../src/app.ts')

const app = buildApp()

const USER = {
  firstName: 'João',
  lastName: 'Silva',
  email: 'joao.silva@example.com',
  password: 'senha-secreta',
}

function truncateAuthTables(dbName: string): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl(dbName) })

  return pool
    .query('TRUNCATE TABLE users RESTART IDENTITY CASCADE')
    .finally(() => pool.end())
}

async function promoteUserToAdmin(dbName: string, email: string): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl(dbName) })

  await pool
    .query('UPDATE users SET role = $1 WHERE email = $2', ['admin', email])
    .finally(() => pool.end())
}

beforeEach(async () => {
  await truncateAuthTables(DB_NAME)
})

after(async () => {
  await app.close()
})

async function createUser(): Promise<void> {
  const signUp = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-up',
    payload: { ...USER, confirmPassword: USER.password },
  })

  assert.equal(signUp.statusCode, 201)

  const confirm = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/confirm',
    payload: { token: signUp.json().user.confirmation_token },
  })

  assert.equal(confirm.statusCode, 200)
}

async function createUnconfirmedUser(): Promise<void> {
  const signUp = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-up',
    payload: { ...USER, confirmPassword: USER.password },
  })

  assert.equal(signUp.statusCode, 201)
}

async function signIn(): Promise<ReturnType<FastifyInstance['inject']>> {
  return app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-in',
    payload: { email: USER.email, password: USER.password },
  })
}

test('POST /api/v1/auth/sign-up retorna 201 e cria o usuário', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-up',
    payload: { ...USER, confirmPassword: USER.password },
  })

  assert.equal(response.statusCode, 201)

  const body = response.json()
  assert.equal(body.status, 'success')
  assert.equal(body.user.email, USER.email)
  assert.equal(body.user.role, 'user')
  assert.equal(body.user.active, false)
  assert.ok(body.user.confirmation_token)
  assert.equal(body.user.password, undefined)
})

test('POST /api/v1/auth/sign-in retorna 200 com token e refresh_token', async () => {
  await createUser()

  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-in',
    payload: { email: USER.email, password: USER.password },
  })

  assert.equal(response.statusCode, 200)

  const body = response.json()
  assert.ok(body.token)
  assert.ok(body.refresh_token)
  assert.notEqual(body.token, body.refresh_token)
})

test('POST /api/v1/auth/sign-in retorna 401 para senha incorreta', async () => {
  await createUser()

  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-in',
    payload: { email: USER.email, password: 'senha-errada' },
  })

  assert.equal(response.statusCode, 401)
  assert.equal(response.json().message, 'E-mail ou senha inválidos.')
})

test('POST /api/v1/auth/sign-in retorna 401 para e-mail inexistente', async () => {
  await createUser()

  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-in',
    payload: { email: 'nao.existe@example.com', password: USER.password },
  })

  assert.equal(response.statusCode, 401)
  assert.equal(response.json().message, 'E-mail ou senha inválidos.')
})

test('POST /api/v1/auth/sign-in retorna 403 para conta ainda não ativada', async () => {
  await createUnconfirmedUser()

  const response = await signIn()

  assert.equal(response.statusCode, 403)
  assert.equal(response.json().message, 'Conta não ativada. Por favor, confirme o seu e-mail.')
})

test('POST /api/v1/auth/confirm ativa a conta e permite o login', async () => {
  const signUp = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-up',
    payload: { ...USER, confirmPassword: USER.password },
  })
  assert.equal(signUp.statusCode, 201)

  const confirmationToken = signUp.json().user.confirmation_token

  const blocked = await signIn()
  assert.equal(blocked.statusCode, 403)

  const confirm = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/confirm',
    payload: { token: confirmationToken },
  })

  assert.equal(confirm.statusCode, 200)
  assert.equal(confirm.json().message, 'Conta confirmada com sucesso!')

  const signInResponse = await signIn()
  assert.equal(signInResponse.statusCode, 200)
})

test('POST /api/v1/auth/confirm retorna 404 para token inválido', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/confirm',
    payload: { token: 'token-inexistente' },
  })

  assert.equal(response.statusCode, 404)
  assert.equal(response.json().message, 'Token de confirmação inválido.')
})

test('POST /api/v1/auth/confirm retorna 404 para token já utilizado', async () => {
  const signUp = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-up',
    payload: { ...USER, confirmPassword: USER.password },
  })

  const confirmationToken = signUp.json().user.confirmation_token

  const first = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/confirm',
    payload: { token: confirmationToken },
  })
  assert.equal(first.statusCode, 200)

  const reused = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/confirm',
    payload: { token: confirmationToken },
  })
  assert.equal(reused.statusCode, 404)
})

test('apenas uma sessão ativa por usuário', async () => {
  await createUser()
  await promoteUserToAdmin(DB_NAME, USER.email)

  const firstSignIn = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-in',
    payload: { email: USER.email, password: USER.password },
  })

  const secondSignIn = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-in',
    payload: { email: USER.email, password: USER.password },
  })

  const firstToken = firstSignIn.json().token
  const secondToken = secondSignIn.json().token

  const withOldToken = await app.inject({
    method: 'POST',
    url: '/api/v1/videos',
    headers: { authorization: `Bearer ${firstToken}` },
    payload: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  })

  const withNewToken = await app.inject({
    method: 'POST',
    url: '/api/v1/videos',
    headers: { authorization: `Bearer ${secondToken}` },
    payload: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  })

  assert.equal(withOldToken.statusCode, 401)
  assert.equal(withNewToken.statusCode, 201)
})

test('POST /api/v1/auth/refresh-token retorna novos tokens e revoga o antigo', async () => {
  await createUser()
  await promoteUserToAdmin(DB_NAME, USER.email)

  const signIn = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-in',
    payload: { email: USER.email, password: USER.password },
  })

  const oldRefreshToken = signIn.json().refresh_token
  const oldToken = signIn.json().token

  const refresh = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/refresh-token',
    payload: { refresh_token: oldRefreshToken },
  })

  assert.equal(refresh.statusCode, 200)

  const body = refresh.json()
  assert.ok(body.token)
  assert.ok(body.refresh_token)
  assert.notEqual(body.refresh_token, oldRefreshToken)

  const withOldToken = await app.inject({
    method: 'POST',
    url: '/api/v1/videos',
    headers: { authorization: `Bearer ${oldToken}` },
    payload: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  })

  const withNewToken = await app.inject({
    method: 'POST',
    url: '/api/v1/videos',
    headers: { authorization: `Bearer ${body.token}` },
    payload: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  })

  assert.equal(withOldToken.statusCode, 401)
  assert.equal(withNewToken.statusCode, 201)
})

test('POST /api/v1/auth/refresh-token retorna 401 para refresh token inválido', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/refresh-token',
    payload: { refresh_token: 'token-inexistente' },
  })

  assert.equal(response.statusCode, 401)
  assert.equal(response.json().message, 'Refresh token inválido ou expirado.')
})

test('POST /api/v1/auth/refresh-token retorna 401 para refresh token reutilizado', async () => {
  await createUser()

  const signIn = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-in',
    payload: { email: USER.email, password: USER.password },
  })

  const refreshToken = signIn.json().refresh_token

  await app.inject({
    method: 'POST',
    url: '/api/v1/auth/refresh-token',
    payload: { refresh_token: refreshToken },
  })

  const reuse = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/refresh-token',
    payload: { refresh_token: refreshToken },
  })

  assert.equal(reuse.statusCode, 401)
})

test('POST /api/v1/auth/sign-out encerra a sessão e invalida o refresh token', async () => {
  await createUser()
  await promoteUserToAdmin(DB_NAME, USER.email)

  const signIn = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-in',
    payload: { email: USER.email, password: USER.password },
  })
  assert.equal(signIn.statusCode, 200)

  const token = signIn.json().token
  const refreshToken = signIn.json().refresh_token

  const signOut = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-out',
    headers: { authorization: `Bearer ${token}` },
  })
  assert.equal(signOut.statusCode, 200)

  const withOldToken = await app.inject({
    method: 'POST',
    url: '/api/v1/videos',
    headers: { authorization: `Bearer ${token}` },
    payload: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  })
  assert.equal(withOldToken.statusCode, 401)

  const withOldRefresh = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/refresh-token',
    payload: { refresh_token: refreshToken },
  })
  assert.equal(withOldRefresh.statusCode, 401)
})

test('POST /api/v1/auth/sign-out retorna 401 sem token válido', async () => {
  const withoutToken = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-out',
  })
  assert.equal(withoutToken.statusCode, 401)

  const withInvalidToken = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-out',
    headers: { authorization: 'Bearer token-invalido' },
  })
  assert.equal(withInvalidToken.statusCode, 401)
})

test('usuário comum (role user) consegue fazer sign-out', async () => {
  await createUser()

  const signIn = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-in',
    payload: { email: USER.email, password: USER.password },
  })
  assert.equal(signIn.statusCode, 200)

  const token = signIn.json().token

  const blockedMutation = await app.inject({
    method: 'POST',
    url: '/api/v1/videos',
    headers: { authorization: `Bearer ${token}` },
    payload: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  })
  assert.equal(blockedMutation.statusCode, 403)

  const signOut = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-out',
    headers: { authorization: `Bearer ${token}` },
  })
  assert.equal(signOut.statusCode, 200)

  const afterSignOut = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-out',
    headers: { authorization: `Bearer ${token}` },
  })
  assert.equal(afterSignOut.statusCode, 401)
})

test('mutações exigem token e sessão válidos', async () => {
  await createUser()

  const withoutToken = await app.inject({
    method: 'POST',
    url: '/api/v1/videos',
    payload: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  })
  assert.equal(withoutToken.statusCode, 401)

  const withInvalidToken = await app.inject({
    method: 'POST',
    url: '/api/v1/videos',
    headers: { authorization: 'Bearer token-invalido' },
    payload: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  })
  assert.equal(withInvalidToken.statusCode, 401)
})

test('rotas GET são públicas e não exigem token', async () => {
  await createUser()

  const withoutToken = await app.inject({ method: 'GET', url: '/api/v1/videos' })
  assert.equal(withoutToken.statusCode, 200)

  const withInvalidToken = await app.inject({
    method: 'GET',
    url: '/api/v1/videos',
    headers: { authorization: 'Bearer token-invalido' },
  })
  assert.equal(withInvalidToken.statusCode, 200)
})

test('rotas públicas continuam acessíveis sem autenticação', async () => {
  const signUp = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-up',
    payload: { ...USER, confirmPassword: USER.password },
  })
  assert.equal(signUp.statusCode, 201)

  const confirm = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/confirm',
    payload: { token: signUp.json().user.confirmation_token },
  })
  assert.equal(confirm.statusCode, 200)

  const signIn = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-in',
    payload: { email: USER.email, password: USER.password },
  })
  assert.equal(signIn.statusCode, 200)

  const refresh = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/refresh-token',
    payload: { refresh_token: signIn.json().refresh_token },
  })
  assert.equal(refresh.statusCode, 200)
})

test('usuário comum (role user) recebe 403 em rotas de mutação, mas lê normalmente', async () => {
  await createUser()

  const signIn = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-in',
    payload: { email: USER.email, password: USER.password },
  })

  const token = signIn.json().token

  const mutation = await app.inject({
    method: 'POST',
    url: '/api/v1/videos',
    headers: { authorization: `Bearer ${token}` },
    payload: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  })
  assert.equal(mutation.statusCode, 403)

  const reading = await app.inject({
    method: 'GET',
    url: '/api/v1/videos',
    headers: { authorization: `Bearer ${token}` },
  })
  assert.equal(reading.statusCode, 200)
})

test('usuário com role admin pode criar vídeos', async () => {
  await createUser()
  await promoteUserToAdmin(DB_NAME, USER.email)

  const signIn = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-in',
    payload: { email: USER.email, password: USER.password },
  })

  const token = signIn.json().token

  const creation = await app.inject({
    method: 'POST',
    url: '/api/v1/videos',
    headers: { authorization: `Bearer ${token}` },
    payload: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  })
  assert.equal(creation.statusCode, 201)
})