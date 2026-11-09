import { sectionOf, sectionOrder, type Section } from '~/composables/useSection'
import { cssTime } from '~/utils/cssTime'
import { TILE_SIZE } from '~/utils/markRipple'
import { changeOrigin } from '~/utils/pageArrival'
import { sound, soundSlide } from '~/utils/sounds'
import { createTileCover, TILE_TIMING, type TileField } from '~/utils/tileCover'

/**
 * Tags each page view transition with where it travels along the flag:
 * `section-forward` / `section-back` when the section changes, `section-same`
 * otherwise, plus `to-<section>` for where it lands. The CSS in main.css
 * picks the animation from the types.
 * Nuxt already skips view transitions under prefers-reduced-motion.
 *
 * Section changes get the tiled reveal where WebGL2 and the CSS Paint API
 * both run (Chromium). A canvas over the new page (utils/tileCover) paints
 * the old stage with the slabs cut out of it, on the GPU, spreading from
 * where the change started (utils/pageArrival: the press, else the band). The
 * old page, header and footer ride above it, cleared from the press outward
 * just ahead of the slabs by public/worklets/tile-wipe.js. The
 * `has-tile-wipe` class turns it on once both are ready; anywhere else, or
 * under forced colors, the straight clip-path wipe stays.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const routeBaseName = useRouteBaseName()
  const root = document.documentElement
  let type = 'section-same'
  let target: Section = 'about'
  // Where the band's marker stood as the navigation began, across the screen
  // (-1 left to 1 right), so its slide can be heard going from there.
  let markerFrom: number | undefined
  const markerAt = () => {
    const box = document.querySelector('.flag-nav__marker')?.getBoundingClientRect()
    return box?.width ? ((box.left + box.width / 2) / root.clientWidth) * 2 - 1 : undefined
  }

  router.beforeEach((to, from) => {
    markerFrom = markerAt()
    target = sectionOf(routeBaseName(to))
    const delta = sectionOrder.indexOf(target) - sectionOrder.indexOf(sectionOf(routeBaseName(from)))
    type = delta > 0 ? 'section-forward' : delta < 0 ? 'section-back' : 'section-same'
  })

  const canvas = document.createElement('canvas')
  canvas.className = 'tile-cover'
  canvas.setAttribute('aria-hidden', 'true')
  const cover = 'paintWorklet' in CSS ? createTileCover(canvas) : null
  if (cover) {
    document.body.append(canvas)
    canvas.addEventListener('webglcontextlost', () => root.classList.remove('has-tile-wipe'))
    const worklet = (CSS as unknown as { paintWorklet: { addModule: (url: string) => Promise<void> } }).paintWorklet
    worklet
      .addModule(`${useRuntimeConfig().app.baseURL}worklets/tile-wipe.js`)
      .then(() => root.classList.add('has-tile-wipe'))
      .catch(() => {})
  }

  // The root snapshot spans the large viewport (under a phone's retracting
  // toolbar too); clientHeight is the small one, leaving a strip with no tiles.
  function largeViewportHeight() {
    const probe = document.createElement('div')
    probe.style.cssText = 'position:fixed;top:0;height:100lvh;visibility:hidden;pointer-events:none'
    document.body.append(probe)
    const height = probe.offsetHeight || root.clientHeight
    probe.remove()
    return height
  }

  /** Where each part that clears above the cover was read, for the worklet. */
  function setOffsets() {
    for (const [name, selector] of [['page', 'main'], ['header', '.site-header'], ['footer', '.site-footer']] as const) {
      const box = document.querySelector(selector)?.getBoundingClientRect()
      root.style.setProperty(`--tile-${name}-x`, String(box?.left ?? 0))
      root.style.setProperty(`--tile-${name}-y`, String(box?.top ?? 0))
    }
  }

  /**
   * How far the old stage dims under the slabs. Each scheme's stages sit near
   * one lightness, so undimmed the slabs differ in hue alone and shimmer
   * (dark, vivid) or vanish (light's paper on paper). Not dark into work: its
   * stage is night itself, and its slabs would vanish into the dimmed one.
   */
  function dim() {
    if (root.classList.contains('dark')) return target === 'work' ? 1 : 0.4
    if (root.classList.contains('light')) return 0.9
    if (root.classList.contains('vivid')) return 0.72
    return 1
  }

  let current: ViewTransition | undefined
  // The change running, and the one waiting for its old state to be captured.
  let tiles: { field: TileField; color: string; dim: number; shadow: number } | undefined
  let pending: typeof tiles

  // Before the old state is captured: the page, header and footer get names
  // of their own (main.css, data-tile-leaving) to ride above the cover.
  function revealTiles(transition: ViewTransition) {
    const from = changeOrigin()
    const field: TileField = {
      width: root.clientWidth,
      height: largeViewportHeight(),
      tile: TILE_SIZE,
      originX: from.x,
      originY: from.y,
      way: type === 'section-back' ? -1 : 1,
    }
    for (const [name, value] of Object.entries(TILE_TIMING)) root.style.setProperty(`--tile-${name}`, String(value))
    root.style.setProperty('--tile-vw', String(field.width))
    root.style.setProperty('--tile-vh', String(field.height))
    root.style.setProperty('--tile-from-x', String(from.x))
    root.style.setProperty('--tile-from-y', String(from.y))
    root.style.setProperty('--tile-way', String(field.way))
    setOffsets()
    // Dark's stage is near black already: its shadows need more to read.
    const shadow = root.classList.contains('dark') ? 0.75 : 0.4
    const run = { field, color: getComputedStyle(document.body).backgroundColor, dim: dim(), shadow }
    tiles = pending = run
    root.dataset.tileLeaving = ''
    transition.finished.finally(() => {
      if (tiles !== run) return
      delete root.dataset.tileLeaving
      delete root.dataset.tileCover
      tiles = undefined
      cover?.clear()
    })
  }

  // Navigation carries on once the old state is captured: the cover goes in
  // for the new state with its first frame drawn, and runs once the
  // transition does, in step with the worklet's linear progress.
  router.afterEach(() => {
    const run = pending
    pending = undefined
    if (!run || !cover) return
    delete root.dataset.tileLeaving
    root.dataset.tileCover = ''
    cover.prepare(run.field, run.color, run.dim, run.shadow)
    const duration = cssTime('--tile-transition') || 950
    let start: number | undefined
    const frame = (now: number) => {
      if (tiles !== run) return
      start ??= now
      const progress = Math.min((now - start) / duration, 1)
      cover.draw(progress)
      if (progress < 1) requestAnimationFrame(frame)
    }
    current?.ready.then(() => requestAnimationFrame(frame), () => {})
  })

  // Once the new page is in, the marker stands where it's sliding to.
  async function slideMarker(transition: ViewTransition) {
    const from = markerFrom
    try {
      await transition.ready
    } catch {
      return
    }
    const to = markerAt()
    if (from !== undefined && to !== undefined && Math.abs(to - from) > 0.01) soundSlide(from, to)
  }

  nuxtApp.hook('page:view-transition:start', (transition) => {
    current = transition
    // ViewTransition.types is missing in browsers without VT types; those get
    // the default crossfade.
    transition.types?.add(type)
    transition.types?.add(`to-${target}`)
    if (type !== 'section-same') sound(type === 'section-forward' ? 'forward' : 'back')
    slideMarker(transition)
    if (
      type !== 'section-same' &&
      root.classList.contains('has-tile-wipe') &&
      !matchMedia('(forced-colors: active)').matches
    ) {
      revealTiles(transition)
    }
  })
})
