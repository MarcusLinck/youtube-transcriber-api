import { test, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { createDatabaseIfNotExists, databaseUrl, runMigrations, truncateTables } from '../helpers/test-db.ts'
import { getAuthHeaders } from '../helpers/auth.ts'

const DB_NAME = 'videos_test_e2e'

process.env.DATABASE_URL = databaseUrl(DB_NAME)

await createDatabaseIfNotExists(DB_NAME)
await runMigrations(DB_NAME)

const { buildApp } = await import('../../src/app.ts')
const { pool } = await import('@shared/db')

const app = buildApp()

const authHeaders = await getAuthHeaders(app)

after(async () => {
  await app.close()
  await pool.end()
})

let videoId = ''

beforeEach(async () => {
  await truncateTables(DB_NAME)

  const response = await app.inject({ ...authHeaders,
    method: 'POST',
    url: '/api/v1/videos',
    payload: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  })

  assert.equal(response.statusCode, 201)
  videoId = response.json().video.id
})

test('POST /api/v1/videos retorna 201 ao criar vídeo com URL válida', async () => {
  const url = 'https://youtu.be/dQw4w9WgXcQ'

  const response = await app.inject({ ...authHeaders,
    method: 'POST',
    url: '/api/v1/videos',
    payload: { url },
  })

  assert.equal(response.statusCode, 201)

  const body = response.json()
  assert.equal(body.status, 'success')
  assert.ok(body.message)
  assert.ok(body.video.id)
  assert.equal(body.video.youtube_url, url)
  assert.equal(body.video.youtube_id, 'dQw4w9WgXcQ')
  assert.equal(body.video.content, undefined)
})

test('POST /api/v1/videos retorna 400 quando a URL é inválida', async () => {
  const response = await app.inject({ ...authHeaders,
    method: 'POST',
    url: '/api/v1/videos',
    payload: { url: 'não-é-uma-url' },
  })

  assert.equal(response.statusCode, 400)
  assert.equal(response.json().status, 'error')
})

test('GET /api/v1/videos retorna 200 e os vídeos existentes', async () => {
  const response = await app.inject({ ...authHeaders, method: 'GET', url: '/api/v1/videos' })

  assert.equal(response.statusCode, 200)

  const body = response.json()
  assert.equal(body.status, 'success')
  assert.ok(Array.isArray(body.videos))
  assert.ok(body.videos.some((video: { id: string }) => video.id === videoId))
})

test('GET /api/v1/videos/:id retorna 200 e os detalhes do vídeo', async () => {
  const response = await app.inject({ ...authHeaders, method: 'GET', url: `/api/v1/videos/${videoId}` })

  assert.equal(response.statusCode, 200)
  assert.equal(response.json().status, 'success')
  assert.equal(response.json().video.id, videoId)
  assert.equal(response.json().video.youtube_id, 'dQw4w9WgXcQ')
})

test('GET /api/v1/videos/:id retorna 404 para vídeo inexistente', async () => {
  const response = await app.inject({ ...authHeaders, method: 'GET', url: '/api/v1/videos/id-inexistente' })

  assert.equal(response.statusCode, 404)
  assert.equal(response.json().status, 'error')
  assert.equal(response.json().message, 'Vídeo não encontrado.')
})