import { canMove, deal, draw, move, targets, won, type From, type Game, type To } from '../app/utils/solitaire.ts'

/** Whether a game can be won from here, and how many positions that took to find. */
export function solve(start: Game, limit = 1_000_000) {
  const seen = new Set<string>()
  const stack = [start]
  while (stack.length && seen.size < limit) {
    const game = stack.pop()!
    if (won(game)) return { winnable: true, positions: seen.size }
    const key = JSON.stringify(game)
    if (seen.has(key)) continue
    seen.add(key)
    const froms: From[] = [{ from: 'waste' }, { from: 'heading' }]
    game.columns.forEach((column, col) => column.forEach((card, index) => {
      if (card.up) froms.push({ from: 'column', col, index })
    }))
    stack.push(draw(game))
    for (const from of froms) {
      if (from.from === 'heading' && !canMove(game, from, { to: 'pile' })) continue
      for (const to of targets(game, from)) stack.push(move(game, from, to))
    }
  }
  return { winnable: false, positions: seen.size, exhausted: !stack.length }
}

export const solveSeed = (seed: number) => solve(deal(seed))

/*
 * A casual player: any move that looks useful, picked blindly, or else a draw.
 * Useful is a card going to a pile, off the waste, or uncovering a face-down one.
 * Gives up after two trips through the stock with nothing to do.
 */
function playCasually(start: Game, random: () => number) {
  let game = start
  let idle = 0
  for (let step = 0; step < 400 && idle <= 42; step++) {
    if (won(game)) return true
    const useful: [From, To][] = []
    for (const to of targets(game, { from: 'heading' })) useful.push([{ from: 'heading' }, to])
    for (const to of targets(game, { from: 'waste' })) useful.push([{ from: 'waste' }, to])
    game.columns.forEach((column, col) => column.forEach((card, index) => {
      if (!card.up) return
      const uncovers = index > 0 && !column[index - 1]!.up
      for (const to of targets(game, { from: 'column', col, index })) {
        if (to.to === 'pile' || uncovers) useful.push([{ from: 'column', col, index }, to])
      }
    }))
    const pick = useful[Math.floor(random() * useful.length)]
    if (pick) {
      game = move(game, ...pick)
      idle = 0
    }
    else {
      game = draw(game)
      idle++
    }
  }
  return won(game)
}

/** How much of the time a casual player wins this deal: how easy it is. */
export function ease(seed: number, games = 200) {
  let state = seed * 7919 + 1
  const random = () => (state = (state * 48271) % 2147483647) / 2147483647
  let wins = 0
  for (let i = 0; i < games; i++) if (playCasually(deal(seed), random)) wins++
  return wins / games
}
