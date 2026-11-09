// CSS times as the minifier may write them (app/utils/cssTime.ts). Run with `pnpm test`.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toMs } from '../app/utils/cssTime.ts'

test('toMs reads ms and s alike', () => {
  assert.equal(toMs('550ms'), 550)
  assert.equal(toMs('.55s'), 550)
  assert.equal(toMs(' 1.1s'), 1100)
  assert.equal(toMs('2600ms '), 2600)
  assert.ok(Number.isNaN(toMs('')))
})
