import { sectionOf, sectionOrder, type Section } from '~/composables/useSection'
/**
 * Tags each page view transition with where it travels along the flag:
 * `section-forward` / `section-back` when the section changes, `section-same`
 * otherwise. The CSS in main.css picks the animation from the type.
 * Nuxt already skips view transitions under prefers-reduced-motion.
 *
 * Section changes get the tiled reveal where the CSS Paint API runs
 * (Chromium): masks cut by public/worklets/tile-wipe.js, spreading from where
 * the change started. The `has-tile-wipe` class turns it on once the worklet
 * is ready; anywhere else, or under forced colors, the straight clip-path
 * wipe stays.
 */
const TILE_SIZE = 32
/**
 * Shares of the linear progress, read by the worklet: SPREAD is how scattered
 * the starts are, FLIP a tile's run, LAND the part of it spent flying in.
 * BOUNCE is the spring a tile lands on.
 */
const TILE_TIMING = { spread: 0.45, flip: 0.32, land: 0.7, bounce: 0.25 }

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const routeBaseName = useRouteBaseName()
  const root = document.documentElement
  let type = 'section-same'
  let target: Section = 'about'

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
    const worklet = (CSS as unknown as { paintWorklet: { addModule: (url: string) => Promise<void> } }).paintWorklet
    worklet
      .addModule(`${useRuntimeConfig().app.baseURL}worklets/tile-wipe.js`)
      .then(() => root.classList.add('has-tile-wipe'))
      .catch(() => {})
  }

  function setOffset(name: string) {
    const box = document.querySelector('main')?.getBoundingClientRect()
    root.style.setProperty(`--tile-${name}-x`, String(box?.left ?? 0))
    root.style.setProperty(`--tile-${name}-y`, String(box?.top ?? 0))
  }

  async function revealTiles(transition: ViewTransition) {
    const from = origin(target)
    lastClick = undefined
    root.style.setProperty('--tile-size', String(TILE_SIZE))
    for (const [name, value] of Object.entries(TILE_TIMING)) root.style.setProperty(`--tile-${name}`, String(value))
    root.style.setProperty('--tile-vw', String(root.clientWidth))
    root.style.setProperty('--tile-vh', String(root.clientHeight))
    root.style.setProperty('--tile-from-x', String(from.x))
    root.style.setProperty('--tile-from-y', String(from.y))
    root.style.setProperty('--tile-way', type === 'section-back' ? '-1' : '1')
    // The old page is still in place: its snapshot shows where it was read.
    setOffset('old')
    try {
      await transition.ready
    } catch {
      return
    }
    setOffset('new')
  }

  nuxtApp.hook('page:view-transition:start', (transition) => {
    // ViewTransition.types is missing in browsers without VT types; those get
    // the default crossfade.
    transition.types?.add(type)
    if (
      type !== 'section-same' &&
      root.classList.contains('has-tile-wipe') &&
      !matchMedia('(forced-colors: active)').matches
    ) {
      revealTiles(transition)
    }
  })
})
