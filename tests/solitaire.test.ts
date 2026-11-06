// The 404 page's solitaire (app/utils/solitaire.ts).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canMove, deal, dealFor, draw, HEADING, move, REASONS, SEEDS, won, type Game } from '../app/utils/solitaire.ts'
import { ease, solveSeed } from './solitaireSolver.ts'

const game = (over: Partial<Game>): Game => ({ columns: [[], [], [], [], []], stock: [], waste: [], piles: [0, 0, 0], ...over })

test('every seed dealt can be won', () => {
  for (const seed of SEEDS) assert.ok(solveSeed(seed).winnable, `seed ${seed}`)
})

test('every seed dealt is easy', () => {
  for (const seed of SEEDS) assert.ok(ease(seed) >= 0.9, `seed ${seed}`)
})

test('a deal is all the codes but 404, the last of each column up', () => {
  const dealt = deal(1)
  const codes = [...dealt.columns.flat().map((card) => card.code), ...dealt.stock].sort()
  assert.deepEqual(codes, Object.keys(REASONS).map(Number).filter((code) => code !== HEADING))
  for (const column of dealt.columns) assert.deepEqual(column.map((card) => card.up), column.map((_, i) => i === column.length - 1))
})

test('the same URL deals the same game', () => {
  assert.deepEqual(dealFor('/nope'), dealFor('/nope'))
})

test('columns build down across suits', () => {
  const g = game({ columns: [[{ code: 205, up: true }], [{ code: 304, up: true }], [{ code: 204, up: true }], [], []] })
  assert.ok(canMove(g, { from: 'column', col: 1, index: 0 }, { to: 'column', col: 0 }))
  assert.ok(!canMove(g, { from: 'column', col: 2, index: 0 }, { to: 'column', col: 0 }), 'same suit')
  assert.ok(!canMove(g, { from: 'column', col: 0, index: 0 }, { to: 'column', col: 1 }), 'rank up')
})

test('an empty column only takes the top rank', () => {
  const g = game({ waste: [205] })
  assert.ok(!canMove(g, { from: 'waste' }, { to: 'column', col: 0 }))
  assert.ok(canMove(game({ waste: [306] }), { from: 'waste' }, { to: 'column', col: 0 }))
})

test('moving a run turns up what it leaves', () => {
  const g = game({ columns: [[{ code: 206, up: false }, { code: 305, up: true }, { code: 204, up: true }], [{ code: 406, up: true }], [], [], []] })
  const next = move(g, { from: 'column', col: 0, index: 1 }, { to: 'column', col: 1 })
  assert.deepEqual(next.columns[0], [{ code: 206, up: true }])
  assert.deepEqual(next.columns[1]!.map((card) => card.code), [406, 305, 204])
})

test('the heading only goes on the 4xx pile, after 403', () => {
  const early = game({ piles: [0, 0, 3] })
  assert.ok(!canMove(early, { from: 'heading' }, { to: 'pile' }))
  const ready = game({ piles: [0, 0, 4], columns: [[{ code: 305, up: true }], [], [], [], []] })
  assert.ok(canMove(ready, { from: 'heading' }, { to: 'pile' }))
  assert.ok(!canMove(ready, { from: 'heading' }, { to: 'column', col: 0 }))
  assert.equal(move(ready, { from: 'heading' }, { to: 'pile' }).piles[2], 5)
})

test('405 waits for the heading', () => {
  assert.ok(!canMove(game({ waste: [405], piles: [0, 0, 4] }), { from: 'waste' }, { to: 'pile' }))
})

test('the stock turns over onto the waste, then back in the same order', () => {
  let g = game({ stock: [200, 201] })
  g = draw(draw(g))
  assert.deepEqual(g.waste, [200, 201])
  assert.deepEqual(draw(g).stock, [200, 201])
})

test('won when every pile is full', () => {
  assert.ok(won(game({ piles: [7, 7, 7] })))
  assert.ok(!won(game({ piles: [7, 7, 4] })))
})
