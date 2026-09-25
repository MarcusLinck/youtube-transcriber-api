import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractYoutubeId } from '@shared/lib/youtube'

test('extrai o id de URLs no formato watch?v=', () => {
  assert.equal(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
})

test('extrai o id ignorando parâmetros extras', () => {
  assert.equal(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=abc'), 'dQw4w9WgXcQ')
  assert.equal(extractYoutubeId('https://www.youtube.com/watch?list=abc&v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
})

test('extrai o id de URLs no formato youtu.be', () => {
  assert.equal(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
})

test('extrai o id de URLs no formato shorts e embed', () => {
  assert.equal(extractYoutubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  assert.equal(extractYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
})

test('retorna null para id com tamanho inválido', () => {
  assert.equal(extractYoutubeId('https://www.youtube.com/watch?v=abc'), null)
})

test('retorna null para dados inválidos', () => {
  assert.equal(extractYoutubeId('https://example.com/algum-video'), null)
  assert.equal(extractYoutubeId('https://www.youtube.com/watch?feature=share'), null)
  assert.equal(extractYoutubeId(''), null)
})