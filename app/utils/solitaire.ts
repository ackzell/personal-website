/*
 * The 404 page's solitaire, as plain rules (ErrorSolitaire.vue plays them).
 * The deck is HTTP status codes: 2xx, 3xx and 4xx are the suits, the last
 * digit the rank, 0 to 6. Columns build down by rank across suits, piles up
 * by rank within one. 404 is not in the deal: it's the page's heading, and
 * the only place it can go is the 4xx pile, between 403 and 405.
 */
export const HEADING = 404

export const REASONS: Record<number, string> = {
  200: 'OK', 201: 'Created', 202: 'Accepted', 203: 'Non-Authoritative', 204: 'No Content', 205: 'Reset Content', 206: 'Partial Content',
  300: 'Multiple Choices', 301: 'Moved Permanently', 302: 'Found', 303: 'See Other', 304: 'Not Modified', 305: 'Use Proxy', 306: 'Unused',
  400: 'Bad Request', 401: 'Unauthorized', 402: 'Payment Required', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed', 406: 'Not Acceptable',
}

export type Card = { code: number, up: boolean }
export type Game = {
  columns: Card[][]
  stock: number[]
  waste: number[]
  /** The next rank each suit's pile takes; RANKS is full. */
  piles: number[]
}
export type From = { from: 'waste' } | { from: 'column', col: number, index: number } | { from: 'heading' }
export type To = { to: 'pile' } | { to: 'column', col: number }

export const suitOf = (code: number) => Math.floor(code / 100) - 2
export const rankOf = (code: number) => code % 100

const COLUMNS = 5
export const RANKS = 7

/*
 * Deals are either easy or nearly impossible, with little between, and this is
 * a 404 page: only ones a casual player wins nine times in ten or more are
 * dealt (tests/solitaire.test.ts plays them).
 */
export const SEEDS = [1, 3, 4, 16, 17, 19, 21, 26, 29, 35, 38, 40, 45, 46, 47, 56, 60, 61, 66, 67, 69, 79, 81, 82, 83, 88, 89, 94, 96, 100, 103, 106]

export function deal(seed: number): Game {
  const deck = Object.keys(REASONS).map(Number).filter((code) => code !== HEADING)
  // Mulberry32: the same seed has to deal the same game in every browser.
  let s = seed >>> 0
  const random = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j]!, deck[i]!]
  }
  const columns = Array.from({ length: COLUMNS }, (_, col) =>
    deck.splice(0, col + 1).map((code, i) => ({ code, up: i === col })))
  return { columns, stock: deck, waste: [], piles: [0, 0, 0] }
}

function leadOf(game: Game, from: From) {
  if (from.from === 'heading') return HEADING
  if (from.from === 'waste') return game.waste.at(-1)
  const card = game.columns[from.col]?.[from.index]
  return card?.up ? card.code : undefined
}

export function canMove(game: Game, from: From, to: To) {
  const lead = leadOf(game, from)
  if (lead === undefined) return false
  if (to.to === 'pile') {
    if (from.from === 'column' && from.index !== game.columns[from.col]!.length - 1) return false
    return game.piles[suitOf(lead)] === rankOf(lead)
  }
  if (from.from === 'heading' || (from.from === 'column' && from.col === to.col)) return false
  const top = game.columns[to.col]!.at(-1)
  if (!top) return rankOf(lead) === RANKS - 1
  return top.up && suitOf(top.code) !== suitOf(lead) && rankOf(top.code) === rankOf(lead) + 1
}

/** Everywhere a card can go, its pile first. */
export function targets(game: Game, from: From): To[] {
  const all: To[] = [{ to: 'pile' }, ...game.columns.map((_, col) => ({ to: 'column' as const, col }))]
  return all.filter((to) => canMove(game, from, to))
}

export function move(game: Game, from: From, to: To): Game {
  const next = structuredClone(game)
  let run: Card[] = [{ code: HEADING, up: true }]
  if (from.from === 'waste') run = [{ code: next.waste.pop()!, up: true }]
  if (from.from === 'column') {
    const column = next.columns[from.col]!
    run = column.splice(from.index)
    const top = column.at(-1)
    if (top) top.up = true
  }
  if (to.to === 'pile') next.piles[suitOf(run[0]!.code)]!++
  else next.columns[to.col]!.push(...run)
  return next
}

/** One from the stock to the waste, or the waste back over once the stock is out. */
export function draw(game: Game): Game {
  const next = structuredClone(game)
  if (next.stock.length) next.waste.push(next.stock.shift()!)
  else [next.stock, next.waste] = [next.waste, []]
  return next
}

export const won = (game: Game) => game.piles.every((rank) => rank === RANKS)

/** The deal for a URL, so the same bad URL always deals the same game. */
export function dealFor(path: string) {
  const hash = [...path].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261)
  return deal(SEEDS[hash % SEEDS.length]!)
}
