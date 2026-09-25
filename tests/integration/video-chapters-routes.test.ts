import { test, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { createDatabaseIfNotExists, databaseUrl, runMigrations, truncateTables } from '../helpers/test-db.ts'
import { getAuthHeaders } from '../helpers/auth.ts'

const DB_NAME = 'videos_test_chapters'

process.env.DATABASE_URL = databaseUrl(DB_NAME)

await createDatabaseIfNotExists(DB_NAME)
await runMigrations(DB_NAME)

const { buildApp } = await import('../../src/app.ts')
const { pool } = await import('@shared/db')

const CHAPTERS_CONTENT = '00:00 - Introdução\n00:45 - Desenvolvimento\n02:10 - Conclusão'

const app = buildApp({
  generateChapters: async () => CHAPTERS_CONTENT,
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

test('POST /api/v1/videos/:id/chapters retorna 201 e cria os capítulos', async () => {
  const response = await app.inject({ ...authHeaders,
    method: 'POST',
    url: `/api/v1/videos/${videoId}/chapters`,
  })

  assert.equal(response.statusCode, 201)

  const body = response.json()
  assert.equal(body.status, 'success')
  assert.ok(body.message)
  assert.ok(body.chapter.id)
  assert.equal(body.chapter.video_id, videoId)
  assert.equal(body.chapter.content, CHAPTERS_CONTENT)
  assert.equal(body.chapter.deleted_at, null)
})

test('POST /api/v1/videos/:id/chapters retorna 404 para vídeo inexistente', async () => {
  const response = await app.inject({ ...authHeaders,
    method: 'POST',
    url: '/api/v1/videos/id-inexistente/chapters',
  })

  assert.equal(response.statusCode, 404)
  assert.equal(response.json().status, 'error')
  assert.equal(response.json().message, 'Vídeo não encontrado.')
})

test('POST /api/v1/videos/:id/chapters retorna 409 quando o vídeo já possui capítulos', async () => {
  await app.inject({ ...authHeaders,
    method: 'POST',
    url: `/api/v1/videos/${videoId}/chapters`,
  })

  const response = await app.inject({ ...authHeaders,
    method: 'POST',
    url: `/api/v1/videos/${videoId}/chapters`,
  })

  assert.equal(response.statusCode, 409)
  assert.equal(response.json().status, 'error')
  assert.equal(response.json().message, 'Este vídeo já possui capítulos cadastrados.')
})

test('GET /api/v1/videos/:id/chapters retorna 200 e os capítulos', async () => {
  await app.inject({ ...authHeaders,
    method: 'POST',
    url: `/api/v1/videos/${videoId}/chapters`,
  })

  const response = await app.inject({ ...authHeaders,
    method: 'GET',
    url: `/api/v1/videos/${videoId}/chapters`,
  })

  assert.equal(response.statusCode, 200)

  const body = response.json()
  assert.equal(body.status, 'success')
  assert.ok(body.message)
  assert.equal(body.chapter.video_id, videoId)
  assert.equal(body.chapter.content, CHAPTERS_CONTENT)
})

test('GET /api/v1/videos/:id/chapters retorna 404 para vídeo inexistente', async () => {
  const response = await app.inject({ ...authHeaders,
    method: 'GET',
    url: '/api/v1/videos/id-inexistente/chapters',
  })

  assert.equal(response.statusCode, 404)
  assert.equal(response.json().status, 'error')
  assert.equal(response.json().message, 'Vídeo não encontrado.')
})

test('GET /api/v1/videos/:id/chapters retorna 404 quando não há capítulos', async () => {
  const response = await app.inject({ ...authHeaders,
    method: 'GET',
    url: `/api/v1/videos/${videoId}/chapters`,
  })

  assert.equal(response.statusCode, 404)
  assert.equal(response.json().status, 'error')
  assert.equal(response.json().message, 'Capítulos não encontrados.')
})

test('DELETE /api/v1/videos/:id/chapters retorna 200 e exclui os capítulos', async () => {
  await app.inject({ ...authHeaders,
    method: 'POST',
    url: `/api/v1/videos/${videoId}/chapters`,
  })

  const response = await app.inject({ ...authHeaders,
    method: 'DELETE',
    url: `/api/v1/videos/${videoId}/chapters`,
  })

  assert.equal(response.statusCode, 200)
  assert.equal(response.json().status, 'success')

  const afterDelete = await app.inject({ ...authHeaders,
    method: 'GET',
    url: `/api/v1/videos/${videoId}/chapters`,
  })

  assert.equal(afterDelete.statusCode, 404)
})

test('DELETE /api/v1/videos/:id/chapters retorna 404 para vídeo inexistente', async () => {
  const response = await app.inject({ ...authHeaders,
    method: 'DELETE',
    url: '/api/v1/videos/id-inexistente/chapters',
  })

  assert.equal(response.statusCode, 404)
  assert.equal(response.json().status, 'error')
  assert.equal(response.json().message, 'Vídeo não encontrado.')
})

test('DELETE /api/v1/videos/:id/chapters retorna 404 quando não há capítulos', async () => {
  const response = await app.inject({ ...authHeaders,
    method: 'DELETE',
    url: `/api/v1/videos/${videoId}/chapters`,
  })

  assert.equal(response.statusCode, 404)
  assert.equal(response.json().status, 'error')
  assert.equal(response.json().message, 'Capítulos não encontrados.')
})

test('é possível gerar capítulos novamente após excluir os anteriores', async () => {
  await app.inject({ ...authHeaders,
    method: 'POST',
    url: `/api/v1/videos/${videoId}/chapters`,
  })

  await app.inject({ ...authHeaders,
    method: 'DELETE',
    url: `/api/v1/videos/${videoId}/chapters`,
  })

  const response = await app.inject({ ...authHeaders,
    method: 'POST',
    url: `/api/v1/videos/${videoId}/chapters`,
  })

  assert.equal(response.statusCode, 201)
  assert.equal(response.json().chapter.content, CHAPTERS_CONTENT)
})