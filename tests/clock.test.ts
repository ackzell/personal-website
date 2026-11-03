// The running time the media guide and video player show (app/utils/clock.ts).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatClock } from '../app/utils/clock.ts'

test('minutes and seconds under the hour', () => {
  assert.equal(formatClock(0), '0:00')
  assert.equal(formatClock(65), '1:05')
  assert.equal(formatClock(1190), '19:50')
})

test('hours past the hour, minutes padded', () => {
  assert.equal(formatClock(3600), '1:00:00')
  assert.equal(formatClock(3730), '1:02:10')
})

test('a fraction of a second is dropped', () => {
  assert.equal(formatClock(65.9), '1:05')
})
