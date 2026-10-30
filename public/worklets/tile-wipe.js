/**
 * Masks for the tiled section change. The new page arrives as square slabs
 * spreading out from where the change started (the clicked link): each slab
 * is a window onto the new page, flying in from its own depth (small when
 * far, large when near) and settling on the grid. The front runs ahead in
 * the direction of travel, as the plain wipe does.
 *
 * Used on the new stage and page. On the old page (--tile-invert: 1) it
 * clears the old words from the press outward, just ahead of the slabs, so
 * the two pages' words never mix within a slab's edge.
 *
 * Inputs: --wipe-progress (0..1, animated linearly), and from the plugin:
 * --tile-size, the viewport --tile-vw / --tile-vh, the origin --tile-from-x /
 * --tile-from-y, the box's viewport offset --tile-ox / --tile-oy, the way
 * --tile-way (1 forward: the new page comes from the right; -1 back), and the
 * timing --tile-spread / --tile-flip / --tile-land / --tile-bounce
 * (TILE_TIMING in app/plugins/section-transition.client.ts).
 */

function hash(x, y, z) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

/** How much sooner the front reaches what lies in the direction of travel than what's behind. */
const AHEAD = 0.7
const BEHIND = 1.3

/** How far x is stretched on its side of the press: the wipe edge moves against `way`. */
const stretch = (dx, way) => (dx * way < 0 ? AHEAD : BEHIND)

/** How far the front has to go to a point. */
function distance(x, y, field) {
  const dx = x - field.originX
  return Math.hypot(dx * stretch(dx, field.way), y - field.originY)
}

function reach(field) {
  const { width, height } = field
  return Math.max(distance(0, 0, field), distance(width, 0, field), distance(0, height, field), distance(width, height, field)) || 1
}

function tileTiming(i, j, field, farthest, { spread, flip }) {
  const flipMax = flip * 1.3
  const u = Math.min(distance((i + 0.5) * field.tile, (j + 0.5) * field.tile, field) / farthest, 1)
  const duration = flip * (0.7 + 0.6 * hash(i, j, 1))
  // Scattered only as the front moves out: at the press the page opens at
  // once, so the change answers it.
  const start = (u * (1 - spread) + hash(i, j, 0) * spread * Math.min(u * 4, 1)) * (1 - flipMax)
  // Own depth per slab (share of the focal length), odd rows a step back.
  const depth = -0.8 + 1.1 * hash(i, j, 3) - (j & 1) * 0.15
  return { start, duration, depth, odd: j & 1 }
}

/**
 * How far a slab still has to go, landing on an underdamped spring that
 * settles by the end of its flight; it dips just past the grid and back.
 */
function air(t, bounce) {
  if (t >= 1) return 0
  const zeta = 1 - bounce
  const omega = 4.6 / zeta
  const damped = omega * Math.sqrt(1 - zeta * zeta)
  return Math.exp(-zeta * omega * t) * (Math.cos(damped * t) + ((zeta * omega) / damped) * Math.sin(damped * t))
}

const smoothstep = (a, b, x) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

/** A slab's on-screen square at this progress, or null before it sets off. */
function tileFlight(i, j, timing, field, progress, { land, bounce }) {
  const local = (progress - timing.start) / timing.duration
  if (local <= 0) return null
  const flight = Math.min(local / land, 1)
  const left = air(flight, bounce)
  const focal = Math.max(field.width, field.height) * 1.2
  const k = focal / (focal - timing.depth * focal * left)
  const x = ((i + 0.5) * field.tile + timing.odd * 0.5 * field.tile * left - field.width / 2) * k + field.width / 2
  const y = ((j + 0.5) * field.tile - field.height / 2) * k + field.height / 2
  const half = (field.tile / 2) * k
  // Windows open almost at once: a slow fade would show both pages' text
  // through each other.
  return { x: x - half, y: y - half, size: half * 2, alpha: smoothstep(0, 0.06, flight) }
}

/**
 * Clears the old page from the press out to where the slabs are about to
 * start: no slab at share u of the way starts before (1 - spread) of u across
 * the run, so the clearing keeps LEAD ahead of that. Its SOFT edge fits
 * inside the lead: where a slab starts, the old words are already gone.
 */
const LEAD = 0.1
const SOFT = 0.08

function clearAhead(ctx, size, field, farthest, progress, { spread, flip }, ox, oy) {
  const front = progress / ((1 - spread) * (1 - flip * 1.3)) + LEAD
  ctx.fillRect(0, 0, size.width, size.height)
  if (front <= 0) return
  const x = field.originX - ox
  const y = field.originY - oy
  // Each side of the press on its own stretch; a circle in stretched x.
  for (const side of [-1, 1]) {
    const k = stretch(side, field.way)
    const radius = front * farthest / k
    ctx.save()
    ctx.beginPath()
    ctx.rect(side < 0 ? 0 : x, 0, side < 0 ? Math.max(x, 0) : Math.max(size.width - x, 0), size.height)
    ctx.clip()
    ctx.translate(x, y)
    ctx.scale(1, k)
    const outer = radius
    const inner = Math.max(radius - SOFT * farthest / k, 0)
    const fade = ctx.createRadialGradient(0, 0, inner, 0, 0, outer)
    fade.addColorStop(0, 'rgba(0, 0, 0, 1)')
    fade.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = fade
    ctx.beginPath()
    ctx.arc(0, 0, outer, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
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
        '--tile-way',
        '--tile-invert',
        '--tile-spread',
        '--tile-flip',
        '--tile-land',
        '--tile-bounce',
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
        way: num(props, '--tile-way', 1) < 0 ? -1 : 1,
      }
      const ox = num(props, '--tile-ox', 0)
      const oy = num(props, '--tile-oy', 0)
      const timing = {
        spread: num(props, '--tile-spread', 0.45),
        flip: num(props, '--tile-flip', 0.32),
        land: num(props, '--tile-land', 0.7),
        bounce: num(props, '--tile-bounce', 0.25),
      }
      const farthest = reach(field)
      if (num(props, '--tile-invert', 0) > 0) return clearAhead(ctx, size, field, farthest, progress, timing, ox, oy)
      const cols = Math.ceil(width / field.tile)
      const rows = Math.ceil(height / field.tile)

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const square = tileFlight(i, j, tileTiming(i, j, field, farthest, timing), field, progress, timing)
          if (!square) continue
          ctx.globalAlpha = square.alpha
          // A pixel of overlap so neighboring windows leave no seams.
          ctx.fillRect(square.x - ox - 1, square.y - oy - 1, square.size + 2, square.size + 2)
        }
      }
    }
  },
)
