import { sectionOf, sectionOrder, type Section } from '~/composables/useSection'
import { createTileFlip, readColor, TILE_SIZE, type Rgb, type TileField, type TileFlip } from '~/utils/tileFlip'

/**
 * Tags each page view transition with where it travels along the flag:
 * `section-forward` / `section-back` when the section changes, `section-same`
 * otherwise. The CSS in main.css picks the animation from the type.
 * Nuxt already skips view transitions under prefers-reduced-motion.
 *
 * Section changes get the tiled reveal where it can run: the CSS Paint API
 * (Chromium) for the masks and WebGL2 for the light (utils/tileFlip.ts). The
 * `has-tile-wipe` class turns it on only once both are ready; anywhere else,
 * or under forced colors, the straight clip-path wipe stays.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const routeBaseName = useRouteBaseName()
  const root = document.documentElement
  let type = 'section-same'
  let target: Section = 'about'
  let tiles: TileFlip | null = null

  router.beforeEach((to, from) => {
    target = sectionOf(routeBaseName(to))
    const delta = sectionOrder.indexOf(target) - sectionOrder.indexOf(sectionOf(routeBaseName(from)))
    type = delta > 0 ? 'section-forward' : delta < 0 ? 'section-back' : 'section-same'
  })

  /*
   * Where the change starts: the pointer for a click, the link for a keyboard
   * press. With neither (back/forward), the new section's field in the flag
   * band.
   */
  let lastClick: { x: number; y: number; time: number } | undefined
  document.addEventListener(
    'click',
    (event) => {
      const link = (event.target as Element | null)?.closest?.('a')
      if (event.detail > 0) lastClick = { x: event.clientX, y: event.clientY, time: event.timeStamp }
      else if (link) lastClick = { ...center(link), time: event.timeStamp }
    },
    { capture: true },
  )

  function center(el: Element) {
    const box = el.getBoundingClientRect()
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
  }

  function origin(section: Section) {
    if (lastClick && performance.now() - lastClick.time < 1000) return lastClick
    const field = document.querySelector(`.flag-nav__segment[data-section='${section}'] .flag-nav__field`)
    return field ? center(field) : { x: root.clientWidth / 2, y: 0 }
  }

  if ('paintWorklet' in CSS) {
    const canvas = document.createElement('canvas')
    canvas.className = 'tile-fx'
    canvas.setAttribute('aria-hidden', 'true')
    canvas.width = canvas.height = 1
    tiles = createTileFlip(canvas)
    if (tiles) {
      document.body.append(canvas)
      canvas.addEventListener('webglcontextlost', () => {
        tiles = null
        root.classList.remove('has-tile-wipe')
      })
      const worklet = (CSS as unknown as { paintWorklet: { addModule: (url: string) => Promise<void> } }).paintWorklet
      worklet
        .addModule(`${useRuntimeConfig().app.baseURL}worklets/tile-wipe.js`)
        .then(() => root.classList.add('has-tile-wipe'))
        .catch(() => {})
    }
  }

  /**
   * The new stage color, once the new section is on <html>. useHead can apply
   * data-section a frame or two after the new page is captured, so reading
   * the body right away would still give the old section.
   */
  function stageColor(section: Section) {
    let cached: { css: string; rgb: Rgb } | undefined
    return () => {
      if (root.dataset.section !== section) return null
      const css = getComputedStyle(document.body).backgroundColor
      if (cached?.css !== css) cached = { css, rgb: readColor(css) }
      return cached.rgb
    }
  }

  /** The section's flag field color; it doesn't depend on the current section. */
  function fieldColor(section: Section) {
    const probe = document.createElement('span')
    probe.style.color = `var(--field-${section})`
    document.body.append(probe)
    const css = getComputedStyle(probe).color
    probe.remove()
    return readColor(css)
  }

  function setOffset(name: string) {
    const box = document.querySelector('main')?.getBoundingClientRect()
    root.style.setProperty(`--tile-${name}-x`, String(box?.left ?? 0))
    root.style.setProperty(`--tile-${name}-y`, String(box?.top ?? 0))
  }

  async function revealTiles(transition: ViewTransition, flip: TileFlip) {
    const section = target
    const from = origin(section)
    const field: TileField = {
      width: root.clientWidth,
      height: root.clientHeight,
      tile: TILE_SIZE,
      originX: from.x,
      originY: from.y,
    }
    lastClick = undefined
    root.style.setProperty('--tile-size', String(field.tile))
    root.style.setProperty('--tile-vw', String(field.width))
    root.style.setProperty('--tile-vh', String(field.height))
    root.style.setProperty('--tile-from-x', String(field.originX))
    root.style.setProperty('--tile-from-y', String(field.originY))
    try {
      await transition.ready
    } catch {
      return
    }
    setOffset('new')
    const animation = document
      .getAnimations()
      .find(
        (a) =>
          (a.effect as KeyframeEffect | null)?.pseudoElement === '::view-transition-new(root)' &&
          (a as CSSAnimation).animationName === 'vt-tiles',
      )
    if (!animation) return
    flip.play({
      field,
      stage: stageColor(section),
      light: fieldColor(section),
      progress: () => animation.effect?.getComputedTiming().progress ?? null,
      done: transition.finished,
    })
  }

  nuxtApp.hook('page:view-transition:start', (transition) => {
    // ViewTransition.types is missing in browsers without VT types; those get
    // the default crossfade.
    transition.types?.add(type)
    if (
      tiles &&
      type !== 'section-same' &&
      root.classList.contains('has-tile-wipe') &&
      !matchMedia('(forced-colors: active)').matches
    ) {
      revealTiles(transition, tiles)
    }
  })
})
