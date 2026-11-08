import { TILE_SIZE, rippleLife, tileGlow } from '~/utils/markRipple'

/** Every copy of the mark holds a canvas (SiteMarkLayer), so the ring carries under the header and footer too. */
export const markRippleCanvases = new Set<HTMLCanvasElement>()

const NOT_THE_MARK = 'a, button, input, select, textarea, summary, label, video, iframe, [role="button"], [draggable="true"], [tabindex]:not([tabindex="-1"])'
const TAP_SLOP = 10
const TAP_MS = 600
const MAX_RINGS = 3

function onGlyph(glyph: SVGSVGElement, x: number, y: number) {
  return [...glyph.querySelectorAll<SVGPathElement>('.glyph-ring, .glyph-a')].some((path) => {
    const { x: px, y: py } = new DOMPoint(x, y).matrixTransform(path.getScreenCTM()?.inverse())
    const point = glyph.createSVGPoint()
    point.x = px
    point.y = py
    return path.isPointInFill(point)
  })
}

/** The rings and their frames. Writes only to the copies it paints, never the root, so a press restyles nothing else on the page. */
function createRipple() {
  let rings: { x: number; y: number; born: number }[] = []
  let copies: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }[] = []
  let frame = 0
  let color = ''
  let strength = 0
  let mask = ''

  function stop() {
    cancelAnimationFrame(frame)
    frame = 0
    rings = []
    for (const { canvas, ctx } of copies) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      canvas.parentElement!.hidden = true
    }
    copies = []
  }

  function paint(now: number) {
    const reach = rippleLife(Math.hypot(innerWidth, innerHeight))
    rings = rings.filter((ring) => now - ring.born < reach)
    const [first, ...rest] = copies
    if (!first || !rings.length) return stop()

    const { canvas, ctx } = first
    const cols = canvas.width / 2
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = color
    for (let row = 0; row < canvas.height; row++) {
      const odd = row & 1
      const y = (row + 0.5) * TILE_SIZE
      for (let col = 0; col < cols; col++) {
        const x = (col + 0.5 - odd / 2) * TILE_SIZE
        const tile = row * cols + col
        let glow = 0
        for (const ring of rings) glow = Math.max(glow, tileGlow(Math.hypot(x - ring.x, y - ring.y), tile, now - ring.born))
        if (!glow) continue
        ctx.globalAlpha = glow * strength
        // One canvas pixel is half a tile, so odd rows can sit half a tile over.
        ctx.fillRect(col * 2 - odd, row, 2, 1)
      }
    }
    for (const copy of rest) {
      copy.ctx.clearRect(0, 0, canvas.width, canvas.height)
      copy.ctx.drawImage(canvas, 0, 0)
    }
    frame = requestAnimationFrame(paint)
  }

  /** Puts every copy on screen, sized to the viewport and lined up with it, whatever the glyph's own box. */
  function prepare(glyph: SVGSVGElement) {
    mask ||= `url("data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(glyph))}")`
    const { left, top } = glyph.getBoundingClientRect()
    const cols = Math.ceil(innerWidth / TILE_SIZE) + 1
    const rows = Math.ceil(innerHeight / TILE_SIZE)
    copies = []
    for (const canvas of markRippleCanvases) {
      const ctx = canvas.getContext('2d')
      if (!ctx) continue
      if (canvas.width !== cols * 2 || canvas.height !== rows) {
        canvas.width = cols * 2
        canvas.height = rows
        canvas.style.width = `${cols * TILE_SIZE}px`
        canvas.style.height = `${rows * TILE_SIZE}px`
      }
      canvas.style.translate = `${-left}px ${-top}px`
      const box = canvas.parentElement!
      box.style.maskImage = mask
      box.hidden = false
      copies.push({ canvas, ctx })
    }
    if (!copies[0]) return false
    const style = getComputedStyle(copies[0].canvas)
    color = style.color
    strength = Number(style.getPropertyValue('--mark-ripple-strength'))
    return true
  }

  function start(x: number, y: number, glyph: SVGSVGElement) {
    if (!frame) {
      if (!prepare(glyph)) return
      frame = requestAnimationFrame(paint)
    }
    rings = [...rings.slice(1 - MAX_RINGS), { x, y, born: performance.now() }]
  }

  return { start, stop }
}

/**
 * A tap or click on the backdrop mark sends a ring of tiles through it, and
 * only it: each canvas is masked to the glyph and sits behind the stage. The
 * mark takes no pointer events, so a press is tested against its shape.
 */
export function useMarkRipple() {
  const ripple = createRipple()
  const section = useSection()
  const colorMode = useColorMode()
  // A running ring has the colors it started with; they'd be wrong on a new stage.
  watch([section, () => colorMode.value], ripple.stop)

  let paused = false
  const offTransition = useNuxtApp().hook('page:view-transition:start', (transition) => {
    ripple.stop()
    paused = true
    transition.finished.finally(() => {
      paused = false
    })
  })

  const listening = new AbortController()

  onMounted(() => {
    const calm = matchMedia('(prefers-reduced-motion: reduce)')
    let press: { id: number; x: number; y: number; at: number } | null = null
    const { signal } = listening

    window.addEventListener('pointerdown', (e) => {
      const free = e.button === 0 && !calm.matches && !paused
        && !(e.target instanceof Element && e.target.closest(NOT_THE_MARK))
      press = free ? { id: e.pointerId, x: e.clientX, y: e.clientY, at: e.timeStamp } : null
    }, { passive: true, signal })

    window.addEventListener('pointercancel', () => {
      press = null
    }, { passive: true, signal })

    // Not click: iOS sends none for a tap on something that isn't clickable.
    window.addEventListener('pointerup', (e) => {
      const tap = press
      press = null
      if (!tap || tap.id !== e.pointerId || paused) return
      if (e.timeStamp - tap.at > TAP_MS || Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > TAP_SLOP) return
      if (!getSelection()?.isCollapsed) return
      const glyph = document.querySelector<SVGSVGElement>('.site-mark__svg')
      if (!glyph || !onGlyph(glyph, e.clientX, e.clientY)) return
      ripple.start(e.clientX, e.clientY, glyph)
      haptic('ripple', e.clientX / innerWidth)
    }, { passive: true, signal })
  })

  onBeforeUnmount(() => {
    listening.abort()
    offTransition()
    ripple.stop()
  })
}
