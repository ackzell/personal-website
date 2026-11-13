// The ring of tiles a press sends through the backdrop mark (app/utils/markRipple.ts).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { rippleLife, tileGlow } from '../app/utils/markRipple.ts'

test('a tile stays dark until the ring reaches it, lights, then goes dark', () => {
  assert.equal(tileGlow(500, 3, 100), 0)
  const peak = Math.max(...Array.from({ length: 400 }, (_, t) => tileGlow(500, 3, 500 + t)))
  assert.ok(peak > 0 && peak <= 1)
  assert.equal(tileGlow(500, 3, rippleLife(500)), 0)
})

test('the ring weakens as it travels', () => {
  const peak = (distance: number) => Math.max(...Array.from({ length: 2500 }, (_, t) => tileGlow(distance, 3, t)))
  assert.ok(peak(100) > peak(1200))
})

test('no tile outlives the ring', () => {
  for (let tile = 0; tile < 200; tile++) assert.equal(tileGlow(900, tile, rippleLife(900) + 1), 0)
})
