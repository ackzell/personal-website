export type StrokeName = 'top' | 'bottom' | 'angle' | 'cross'

/** One stroke of the intro mark's pen: when it sets off, how long it takes, and how. Seconds. */
export type Stroke = {
  start: number
  duration: number
  ease: (t: number) => number
  /** How much longer than usual its tiles wait for the pen. */
  wait?: number
  /** Seconds its tiles take to come up along the stroke, for a pen too quick to lead them; otherwise they keep the pen's own pace. */
  sweep?: number
}

export type MarkTile = {
  x: number
  y: number
  /** When it starts to come up, and when the pen reaches it and it starts to go. */
  appear: number
  inked: number
}

/* In the glyph's own units, off the pens in SiteMarkGlyph. */
const FOOT = [88, 200] as const
const TIP = [215, 66] as const
const RING_X = 129.35
const RING_Y = 128
const LEG_TOP = 10
const LEG_LENGTH = 220
const A_AXIS = 131
/** A tile comes up over APPEAR, sits for AHEAD (a beat more for some) until the pen reaches it, then goes over FADE. */
const APPEAR = 0.4
const AHEAD = 0.12
const SCATTER = 0.1
const FADE = 0.3

/** Tiles per side of the mark. */
const GRID = 56

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** Which pen stroke draws a spot of the mark, and how far along it. */
export function strokeAt(x: number, y: number, inA: boolean, inCross: boolean): { stroke: StrokeName, along: number } {
  if (!inA) {
    const dx = x - RING_X
    return y < RING_Y
      ? { stroke: 'top', along: 1 - Math.atan2(RING_Y - y, dx) / Math.PI }
      : { stroke: 'bottom', along: Math.atan2(y - RING_Y, dx) / Math.PI }
  }
  if (inCross) {
    const [dx, dy] = [TIP[0] - FOOT[0], TIP[1] - FOOT[1]]
    return { stroke: 'cross', along: clamp01(((x - FOOT[0]) * dx + (y - FOOT[1]) * dy) / (dx * dx + dy * dy)) }
  }
  const down = clamp01((y - LEG_TOP) / LEG_LENGTH)
  return { stroke: 'angle', along: x < A_AXIS ? (1 - down) / 2 : 0.5 + down / 2 }
}

/** The share of a pen's time at which its eased stroke reaches `along`. */
export function timeAlong(ease: (t: number) => number, along: number) {
  let [low, high] = [0, 1]
  for (let i = 0; i < 12; i++) {
    const middle = (low + high) / 2
    if (ease(middle) < along) low = middle
    else high = middle
  }
  return (low + high) / 2
}

/** When a tile `along` a stroke starts to come up, and when the pen reaches it. */
export function tileTimes(stroke: Stroke, along: number) {
  const inked = stroke.start + stroke.duration * timeAlong(stroke.ease, along)
  const led = stroke.sweep ? stroke.start + along * stroke.sweep : inked
  return { appear: led - (stroke.wait ?? 0) - AHEAD - APPEAR, inked }
}

/** A tile at `clock`, or nothing before it comes up and after it's gone. It comes up as the experience's words do: rising out of a soft blur, here a larger, fainter tile. */
export function tileAt(tile: MarkTile, clock: number, rise: number) {
  if (clock < tile.appear || clock >= tile.inked + FADE) return null
  const t = Math.min(1, (clock - tile.appear) / APPEAR)
  const coming = (1 - t) ** 3
  return {
    x: tile.x,
    y: tile.y + coming * rise,
    alpha: (1 - coming) * Math.min(1, 1 - (clock - tile.inked) / FADE),
    scale: 1 + coming * 1.2,
  }
}

/**
 * The tiles on the mark's bricks, by the center of each. The shapes are drawn
 * once, a pixel to each half tile across (odd rows sit half a tile over) and
 * each row down, in a color channel apiece: testing every brick against the SVG
 * instead takes long enough to matter while a phone is hydrating the page.
 */
function plotTiles(glyph: SVGSVGElement, strokes: Record<StrokeName, Stroke>, size: number) {
  const ring = glyph.querySelector<SVGPathElement>('.glyph-ring')!
  const { left, top, width } = glyph.getBoundingClientRect()
  // The ring's, not the A's: the A may be rocking.
  const matrix = ring.getScreenCTM()!
  const inverse = matrix.inverse()
  const rows = Math.ceil(width / size) + 1
  const across = rows * 2 + 2

  const sample = document.createElement('canvas')
  sample.width = across
  sample.height = rows
  const ctx = sample.getContext('2d', { willReadFrequently: true })!
  ctx.fillRect(0, 0, across, rows)
  ctx.globalCompositeOperation = 'lighter'
  // The half pixel puts every brick's center on a pixel's.
  ctx.setTransform(2 / size, 0, 0, 1 / size, 0.5, 0)
  ctx.translate(-left, -top)
  ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f)
  const fill = (selector: string, color: string, rule?: CanvasFillRule) => {
    ctx.fillStyle = color
    ctx.fill(new Path2D(glyph.querySelector(selector)!.getAttribute('d')!), rule)
  }
  fill('.glyph-ring', '#f00')
  fill('.glyph-a', '#0f0')
  fill('.glyph-legs-bounds', '#00f', 'evenodd')
  const { data } = ctx.getImageData(0, 0, across, rows)

  const tiles: MarkTile[] = []
  for (let row = 0; row < rows; row++) {
    const odd = row & 1
    for (let col = 0; col <= rows; col++) {
      const pixel = (row * across + col * 2 - odd + 1) * 4
      const inA = data[pixel + 1]! >= 128
      if (!inA && data[pixel]! < 128) continue

      const x = (col - odd / 2) * size
      const y = row * size
      const screenX = left + x + size / 2
      const screenY = top + y + size / 2
      const { stroke, along } = strokeAt(
        inverse.a * screenX + inverse.c * screenY + inverse.e,
        inverse.b * screenX + inverse.d * screenY + inverse.f,
        inA,
        data[pixel + 2]! < 128,
      )
      const { appear, inked } = tileTimes(strokes[stroke], along)
      tiles.push({ x, y, appear: appear - Math.random() * SCATTER, inked })
    }
  }
  return tiles
}

/**
 * A canvas over the mark in `box`, holding the small tiles that come up on its
 * bricks just ahead of the pen drawing each part, and go as it's inked.
 */
export function createMarkTiles(box: HTMLElement, glyph: SVGSVGElement, strokes: Record<StrokeName, Stroke>) {
  const { width } = glyph.getBoundingClientRect()
  const dpr = Math.min(devicePixelRatio, 2)
  const size = Math.max(2, width / GRID)
  const rise = size * 3
  // Room for tiles still rising below the mark, and for the odd rows' overhang.
  const margin = rise + size * 2
  const side = Math.ceil(width + margin * 2)
  const tiles = plotTiles(glyph, strokes, size)

  // The clock starts as the first tile comes up.
  let start = Infinity
  for (const tile of tiles) start = Math.min(start, tile.appear)
  let end = 0
  for (const tile of tiles) {
    tile.appear -= start
    tile.inked -= start
    end = Math.max(end, tile.inked + FADE)
  }

  const canvas = document.createElement('canvas')
  canvas.width = side * dpr
  canvas.height = side * dpr
  Object.assign(canvas.style, {
    position: 'absolute',
    left: `${-margin}px`,
    top: `${-margin}px`,
    width: `${side}px`,
    height: `${side}px`,
    pointerEvents: 'none',
  })
  box.append(canvas)
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)
  ctx.fillStyle = getComputedStyle(glyph).color
  // A hair of grout, so it reads as tiles until the pen fills in under them.
  const brick = size * 0.92

  function paint(clock: number) {
    ctx.clearRect(0, 0, side, side)
    for (const tile of tiles) {
      const at = tileAt(tile, clock, rise)
      if (!at) continue
      const drawn = brick * at.scale
      ctx.globalAlpha = at.alpha
      ctx.fillRect(margin + at.x + (size - drawn) / 2, margin + at.y + (size - drawn) / 2, drawn, drawn)
    }
  }

  function destroy() {
    canvas.remove()
    // Hands back the canvas's memory now rather than whenever it's collected.
    canvas.width = 0
    tiles.length = 0
  }

  /** `count` tiles picked at random, when each settles (most of the way through coming up) and where it sits across the mark, -1 to 1. */
  const landings = (count: number) => Array.from({ length: Math.min(count, tiles.length) }, () => {
    const tile = tiles[Math.floor(Math.random() * tiles.length)]!
    return { at: tile.appear + APPEAR * 0.6, pan: ((tile.x + size / 2) / width) * 2 - 1 }
  })

  /** `lead`: how long after the clock starts the first pen sets off. */
  return { paint, destroy, landings, end, lead: -start }
}
