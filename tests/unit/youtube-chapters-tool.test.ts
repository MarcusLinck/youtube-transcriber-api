import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatSecondsToTimestamp } from '@features/chapters/youtube-chapters-tool'

test('formata milissegundos no formato mm:ss', () => {
  assert.equal(formatSecondsToTimestamp(0), '00:00')
  assert.equal(formatSecondsToTimestamp(1000), '00:01')
  assert.equal(formatSecondsToTimestamp(61000), '01:01')
  assert.equal(formatSecondsToTimestamp(125000), '02:05')
  assert.equal(formatSecondsToTimestamp(3599000), '59:59')
})

test('arredonda para baixo os valores fracionados de segundos', () => {
  assert.equal(formatSecondsToTimestamp(1001), '00:01')
  assert.equal(formatSecondsToTimestamp(59999), '00:59')
})