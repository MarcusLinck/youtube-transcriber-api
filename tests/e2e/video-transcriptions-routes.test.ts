import { test, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { createDatabaseIfNotExists, databaseUrl, runMigrations, truncateTables } from '../helpers/test-db.ts'
import { getAuthHeaders } from '../helpers/auth.ts'

const DB_NAME = 'videos_test_e2e_transcriptions'

process.env.DATABASE_URL = databaseUrl(DB_NAME)

await createDatabaseIfNotExists(DB_NAME)
await runMigrations(DB_NAME)

const { buildApp } = await import('../../src/app.ts')
const { pool } = await import('@shared/db')

const app = buildApp({
  generateTranscription: async () => 'Transcrição de exemplo para testes e2e.',
})

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

test('POST /api/v1/videos/:id/transcriptions retorna 201 e cria a transcrição', async () => {
  const response = await app.inject({ ...authHeaders,
    method: 'POST',
    url: `/api/v1/videos/${videoId}/transcriptions`,
  })

  assert.equal(response.statusCode, 201)

  const body = response.json()
  assert.equal(body.status, 'success')
  assert.ok(body.message)
  assert.ok(body.transcription.id)
  assert.equal(body.transcription.video_id, videoId)
  assert.equal(body.transcription.content, 'Transcrição de exemplo para testes e2e.')
  assert.equal(body.transcription.deleted_at, null)
})

test('POST /api/v1/videos/:id/transcriptions retorna 404 para vídeo inexistente', async () => {
  const response = await app.inject({ ...authHeaders,
    method: 'POST',
    url: '/api/v1/videos/id-inexistente/transcriptions',
  })

  assert.equal(response.statusCode, 404)
  assert.equal(response.json().status, 'error')
  assert.equal(response.json().message, 'Vídeo não encontrado.')
})

test('POST /api/v1/videos/:id/transcriptions retorna 409 quando já existe transcrição', async () => {
  await app.inject({ ...authHeaders,
    method: 'POST',
    url: `/api/v1/videos/${videoId}/transcriptions`,
  })

  const response = await app.inject({ ...authHeaders,
    method: 'POST',
    url: `/api/v1/videos/${videoId}/transcriptions`,
  })

  assert.equal(response.statusCode, 409)
  assert.equal(response.json().status, 'error')
  assert.equal(response.json().message, 'Este vídeo já possui uma transcrição cadastrada.')
})

test('GET /api/v1/videos/:id/transcriptions retorna 200 e a transcrição', async () => {
  await app.inject({ ...authHeaders,
    method: 'POST',
    url: `/api/v1/videos/${videoId}/transcriptions`,
  })

  const response = await app.inject({ ...authHeaders,
    method: 'GET',
    url: `/api/v1/videos/${videoId}/transcriptions`,
  })

  assert.equal(response.statusCode, 200)
  assert.equal(response.json().status, 'success')
  assert.equal(response.json().transcription.video_id, videoId)
})

test('GET /api/v1/videos/:id/transcriptions retorna 404 quando não há transcrição', async () => {
  const response = await app.inject({ ...authHeaders,
    method: 'GET',
    url: `/api/v1/videos/${videoId}/transcriptions`,
  })

  assert.equal(response.statusCode, 404)
  assert.equal(response.json().status, 'error')
  assert.equal(response.json().message, 'Transcrição não encontrada.')
})

test('DELETE /api/v1/videos/:id/transcriptions retorna 200 e exclui a transcrição', async () => {
  await app.inject({ ...authHeaders,
    method: 'POST',
    url: `/api/v1/videos/${videoId}/transcriptions`,
  })

  const response = await app.inject({ ...authHeaders,
    method: 'DELETE',
    url: `/api/v1/videos/${videoId}/transcriptions`,
  })

  assert.equal(response.statusCode, 200)
  assert.equal(response.json().status, 'success')

  const afterDelete = await app.inject({ ...authHeaders,
    method: 'GET',
    url: `/api/v1/videos/${videoId}/transcriptions`,
  })

  assert.equal(afterDelete.statusCode, 404)
})

test('DELETE /api/v1/videos/:id/transcriptions retorna 404 para vídeo inexistente', async () => {
  const response = await app.inject({ ...authHeaders,
    method: 'DELETE',
    url: '/api/v1/videos/id-inexistente/transcriptions',
  })

  assert.equal(response.statusCode, 404)
  assert.equal(response.json().status, 'error')
  assert.equal(response.json().message, 'Vídeo não encontrado.')
})