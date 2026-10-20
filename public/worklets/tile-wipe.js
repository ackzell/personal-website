/**
 * Masks for the tiled section change. The new page arrives as square slabs
 * spreading out from where the change started (the clicked link): each slab
 * is a window onto the new page, flying in from its own depth (small when
 * far, large when near) and settling on the grid. utils/tileFlip.ts lights
 * the same slabs on a canvas above, so the light plays over the real page.
 *
 * Used on the new stage and page; the old page fades out on its own (main.css).
 *
 * Inputs: --wipe-progress (0..1, animated linearly), and from the plugin:
 * --tile-size, the viewport --tile-vw / --tile-vh, the origin --tile-from-x /
 * --tile-from-y, and the box's viewport offset --tile-ox / --tile-oy.
 */

// Tile timing and flight. Mirrors app/utils/tileFlip.ts (and its vertex
// shader); keep them in sync.
const SPREAD = 0.45
const FLIP = 0.32
const FLIP_MAX = FLIP * 1.3
/** Share of a tile's run spent flying in; the rest it rests and fades out. */
const LAND = 0.7

function hash(x, y, z) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

function reach({ width, height, originX: x, originY: y }) {
  return Math.max(Math.hypot(x, y), Math.hypot(width - x, y), Math.hypot(x, height - y), Math.hypot(width - x, height - y)) || 1
}

function tileTiming(i, j, field, farthest) {
  const dx = (i + 0.5) * field.tile - field.originX
  const dy = (j + 0.5) * field.tile - field.originY
  const u = Math.min(Math.hypot(dx, dy) / farthest, 1)
  const duration = FLIP * (0.7 + 0.6 * hash(i, j, 1))
  const start = (u * (1 - SPREAD) + hash(i, j, 0) * SPREAD) * (1 - FLIP_MAX)
  // Own depth per slab (share of the focal length), odd rows a step back.
  const depth = -0.8 + 1.1 * hash(i, j, 3) - (j & 1) * 0.15
  return { start, duration, depth, odd: j & 1 }
}
// End of mirrored timing.

const smoothstep = (a, b, x) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

/** A slab's on-screen square at this progress, or null before it sets off. */
function tileFlight(i, j, timing, field, progress) {
  const local = (progress - timing.start) / timing.duration
  if (local <= 0) return null
  const flight = Math.min(local / LAND, 1)
  const air = (1 - flight) ** 3
  const focal = Math.max(field.width, field.height) * 1.2
  const k = focal / (focal - timing.depth * focal * air)
  const x = ((i + 0.5) * field.tile + timing.odd * 0.5 * field.tile * air - field.width / 2) * k + field.width / 2
  const y = ((j + 0.5) * field.tile - field.height / 2) * k + field.height / 2
  const half = (field.tile / 2) * k
  // Windows open almost at once: a slow fade would show both pages' text
  // through each other. The canvas fades the slab's light in instead.
  return { x: x - half, y: y - half, size: half * 2, alpha: smoothstep(0, 0.06, flight) }
}

function num(props, name, fallback) {
  const value = parseFloat(props.get(name).toString())
  return Number.isFinite(value) ? value : fallback
}

registerPaint(
  'tile-wipe',
  class {
    static get inputProperties() {
      return [
        '--wipe-progress',
        '--tile-size',
        '--tile-vw',
        '--tile-vh',
        '--tile-from-x',
        '--tile-from-y',
        '--tile-ox',
        '--tile-oy',
      ]
    }

    paint(ctx, size, props) {
      const progress = num(props, '--wipe-progress', 0)
      const width = num(props, '--tile-vw', size.width)
      const height = num(props, '--tile-vh', size.height)
      const field = {
        width,
        height,
        tile: num(props, '--tile-size', 30),
        originX: num(props, '--tile-from-x', width / 2),
        originY: num(props, '--tile-from-y', height / 2),
      }
      const ox = num(props, '--tile-ox', 0)
      const oy = num(props, '--tile-oy', 0)
      const farthest = reach(field)
      const cols = Math.ceil(width / field.tile)
      const rows = Math.ceil(height / field.tile)

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const square = tileFlight(i, j, tileTiming(i, j, field, farthest), field, progress)
          if (!square) continue
          ctx.globalAlpha = square.alpha
          // A pixel of overlap so neighboring windows leave no seams.
          ctx.fillRect(square.x - ox - 1, square.y - oy - 1, square.size + 2, square.size + 2)
        }
      }
    }
  },
)
