/** One tile of the section transition (the --tile-size of worklets/tile-wipe.js) and the mark's ripple. Odd rows sit half a tile over. */
export const TILE_SIZE = 32

const SPEED = 1 // px per ms
const SCATTER = 110 // ms a tile can lag the front by, so the ring never reads as a clean circle
const RISE = 70
const FALL = 420
const FADE_OVER = 1600 // px over which the ring loses half its strength

// Each tile's own lag, 0 to 1, the same every time.
const grain = (tile: number) => {
  const n = Math.sin(tile * 12.9898) * 43758.5453
  return n - Math.floor(n)
}

/** How lit a tile is, 0 to 1, `age` ms after a press `distance` px away. */
export function tileGlow(distance: number, tile: number, age: number) {
  const reached = age - distance / SPEED
  // Most tiles each frame are outside the ring; they never need their grain.
  if (reached <= 0 || reached >= SCATTER + RISE + FALL) return 0
  const t = reached - grain(tile) * SCATTER
  if (t <= 0 || t >= RISE + FALL) return 0
  const pulse = t < RISE ? t / RISE : (1 - (t - RISE) / FALL) ** 2
  return pulse / (1 + distance / FADE_OVER)
}

/** How long after a press a ring has left every tile within `reach` px. */
export const rippleLife = (reach: number) => reach / SPEED + SCATTER + RISE + FALL
