/**
 * Clears the old page's words for the tiled section change: a soft oval
 * growing from where the change started (the clicked link), just ahead of the
 * slabs the cover cuts (app/utils/tileCover.ts), so the two pages' words never
 * mix within a slab's edge. The oval is stretched along the direction of
 * travel, as the slabs' front is.
 *
 * Used on the old page, header and footer, above the cover. Inputs:
 * --wipe-progress (0..1, animated linearly), and from the plugin: the
 * viewport --tile-vw / --tile-vh, the origin --tile-from-x / --tile-from-y,
 * the box's viewport offset --tile-ox / --tile-oy, the way --tile-way (1
 * forward: the new page comes from the right; -1 back), and the timing
 * --tile-spread / --tile-flip (TILE_TIMING in app/utils/tileCover.ts).
 */

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
        '--tile-vw',
        '--tile-vh',
        '--tile-from-x',
        '--tile-from-y',
        '--tile-ox',
        '--tile-oy',
        '--tile-way',
        '--tile-spread',
        '--tile-flip',
      ]
    }

    paint(ctx, size, props) {
      const width = num(props, '--tile-vw', size.width)
      const height = num(props, '--tile-vh', size.height)
      const field = {
        width,
        height,
        originX: num(props, '--tile-from-x', width / 2),
        originY: num(props, '--tile-from-y', height / 2),
        way: num(props, '--tile-way', 1) < 0 ? -1 : 1,
      }
      const timing = { spread: num(props, '--tile-spread', 0.45), flip: num(props, '--tile-flip', 0.32) }
      clearAhead(ctx, size, field, reach(field), num(props, '--wipe-progress', 0), timing, num(props, '--tile-ox', 0), num(props, '--tile-oy', 0))
    }
  },
)
