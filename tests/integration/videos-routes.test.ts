import { test, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import Redis from 'ioredis'
import { createDatabaseIfNotExists, databaseUrl, runMigrations, truncateTables } from '../helpers/test-db.ts'
import { getAuthHeaders } from '../helpers/auth.ts'

const DB_NAME = 'videos_test'

process.env.DATABASE_URL = databaseUrl(DB_NAME)

await createDatabaseIfNotExists(DB_NAME)
await runMigrations(DB_NAME)

const { buildApp } = await import('../../src/app.ts')
const { pool } = await import('@shared/db')

const app = buildApp()

const authHeaders = await getAuthHeaders(app)

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')

after(async () => {
  await app.close()
  await pool.end()
  await redis.quit()
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

test('POST /api/v1/videos retorna 400 quando a URL obrigatória não é enviada', async () => {
  const response = await app.inject({ ...authHeaders,
    method: 'POST',
    url: '/api/v1/videos',
    payload: {},
  })

  assert.equal(response.statusCode, 400)
  assert.equal(response.json().status, 'error')
})

test('GET /api/v1/videos retorna 200 e lista os vídeos criados', async () => {
  const response = await app.inject({ ...authHeaders, method: 'GET', url: '/api/v1/videos' })

  assert.equal(response.statusCode, 200)

  const body = response.json()
  assert.equal(body.status, 'success')
  assert.ok(Array.isArray(body.videos))
  assert.ok(body.videos.some((video: { id: string }) => video.id === videoId))

  const [video] = body.videos.filter((item: { id: string }) => item.id === videoId)
  assert.equal(video.youtube_id, 'dQw4w9WgXcQ')
  assert.equal(video.content, undefined)
})

test('GET /api/v1/videos/:id retorna 200 e os detalhes do vídeo', async () => {
  const response = await app.inject({ ...authHeaders, method: 'GET', url: `/api/v1/videos/${videoId}` })

  assert.equal(response.statusCode, 200)

  const body = response.json()
  assert.equal(body.status, 'success')
  assert.equal(body.video.id, videoId)
  assert.equal(body.video.youtube_id, 'dQw4w9WgXcQ')
  assert.equal(body.video.content, undefined)
})

test('GET /api/v1/videos/:id retorna 404 para vídeo inexistente', async () => {
  const response = await app.inject({ ...authHeaders, method: 'GET', url: '/api/v1/videos/id-inexistente' })

  assert.equal(response.statusCode, 404)
  assert.equal(response.json().status, 'error')
  assert.equal(response.json().message, 'Vídeo não encontrado.')
})

test('GET /api/v1/videos/:id popula o cache no Redis com TTL de 1 dia', async () => {
  const response = await app.inject({ ...authHeaders, method: 'GET', url: `/api/v1/videos/${videoId}` })
  assert.equal(response.statusCode, 200)

  const cached = await redis.get(`video:${videoId}`)
  assert.ok(cached)

  const ttl = await redis.ttl(`video:${videoId}`)
  assert.ok(ttl > 86000 && ttl <= 86400)

  const parsed = JSON.parse(cached)
  assert.equal(parsed.id, videoId)
  assert.equal(parsed.youtube_id, 'dQw4w9WgXcQ')
  assert.ok(parsed.created_at)
})

test('GET /api/v1/videos/:id retorna os dados do cache quando disponíveis', async () => {
  const fakeVideo = {
    id: videoId,
    youtube_url: 'https://www.youtube.com/watch?v=fakeId',
    youtube_id: 'fakeId',
    created_at: '2020-01-01T00:00:00.000Z',
    updated_at: '2020-01-02T00:00:00.000Z',
  }

  await redis.set(`video:${videoId}`, JSON.stringify(fakeVideo), 'EX', 86400)

  const response = await app.inject({ ...authHeaders, method: 'GET', url: `/api/v1/videos/${videoId}` })

  assert.equal(response.statusCode, 200)

  const body = response.json()
  assert.equal(body.video.id, videoId)
  assert.equal(body.video.youtube_id, 'fakeId')
  assert.notEqual(body.video.youtube_id, 'dQw4w9WgXcQ')
  assert.equal(new Date(body.video.created_at).toISOString(), fakeVideo.created_at)
  assert.equal(new Date(body.video.updated_at).toISOString(), fakeVideo.updated_at)
})