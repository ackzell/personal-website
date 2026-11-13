import assert from 'node:assert/strict'
import { test } from 'node:test'
import { strokeAt, tileAt, tileTimes, timeAlong, type MarkTile } from '../app/utils/markTiles.ts'

const tile: MarkTile = { x: 100, y: 50, appear: 1, inked: 2.5 }

test('a tile comes up on its brick, rising and soft, then sits still', () => {
  assert.equal(tileAt(tile, 0.9, 8), null)
  const coming = tileAt(tile, 1.1, 8)!
  assert.equal(coming.x, 100)
  assert.ok(coming.y > 50 && coming.scale > 1 && coming.alpha < 1)
  assert.deepEqual(tileAt(tile, 2, 8), { x: 100, y: 50, alpha: 1, scale: 1 })
})

test('a tile goes once the pen has reached it', () => {
  assert.equal(tileAt(tile, 2.5, 8)!.alpha, 1)
  assert.ok(tileAt(tile, 2.6, 8)!.alpha < 1)
  assert.equal(tileAt(tile, 3, 8), null)
})

test('timeAlong undoes the ease', () => {
  const ease = (t: number) => t * t
  assert.ok(Math.abs(timeAlong(ease, 0.25) - 0.5) < 0.001)
})

test('strokes land in the order a pen would draw them', () => {
  assert.ok(strokeAt(20, 80, false, false).along < strokeAt(240, 80, false, false).along, 'top arc runs left to right')
  assert.ok(strokeAt(240, 180, false, false).along < strokeAt(20, 180, false, false).along, 'bottom arc runs right to left')
  assert.equal(strokeAt(20, 80, false, false).stroke, 'top')
  assert.equal(strokeAt(20, 180, false, false).stroke, 'bottom')
  assert.ok(strokeAt(80, 200, true, false).along < strokeAt(130, 40, true, false).along, 'up the left leg')
  assert.ok(strokeAt(135, 40, true, false).along < strokeAt(175, 210, true, false).along, 'then down the right')
  assert.equal(strokeAt(200, 80, true, true).stroke, 'cross')
})

test('a swept stroke brings its tiles up in order, however quick its pen', () => {
  const flick = { start: 2, duration: 0.4, ease: (t: number) => t ** 0.1, wait: 0.3, sweep: 0.45 }
  const [first, last] = [tileTimes(flick, 0), tileTimes(flick, 1)]
  assert.ok(Math.abs(last.appear - first.appear - 0.45) < 0.001)
  assert.ok(last.appear < last.inked)
})
