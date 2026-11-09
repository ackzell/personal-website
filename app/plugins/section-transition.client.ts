import { sectionOf, sectionOrder, type Section } from '~/composables/useSection'
import { TILE_SIZE } from '~/utils/markRipple'
import { changeOrigin } from '~/utils/pageArrival'
import { sound, soundSlide } from '~/utils/sounds'

/**
 * Tags each page view transition with where it travels along the flag:
 * `section-forward` / `section-back` when the section changes, `section-same`
 * otherwise, plus `to-<section>` for where it lands. The CSS in main.css
 * picks the animation from the types.
 * Nuxt already skips view transitions under prefers-reduced-motion.
 *
 * Section changes get the tiled reveal where the CSS Paint API runs
 * (Chromium): masks cut by public/worklets/tile-wipe.js, spreading from where
 * the change started (utils/pageArrival: the press, else the band). The
 * `has-tile-wipe` class turns it on once the worklet is ready; anywhere else,
 * or under forced colors, the straight clip-path wipe stays.
 */
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

  if ('paintWorklet' in CSS) {
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

  function setOffset(name: string) {
    const box = document.querySelector('main')?.getBoundingClientRect()
    root.style.setProperty(`--tile-${name}-x`, String(box?.left ?? 0))
    root.style.setProperty(`--tile-${name}-y`, String(box?.top ?? 0))
  }

  async function revealTiles(transition: ViewTransition) {
    const from = changeOrigin()
    root.style.setProperty('--tile-size', String(TILE_SIZE))
    for (const [name, value] of Object.entries(TILE_TIMING)) root.style.setProperty(`--tile-${name}`, String(value))
    root.style.setProperty('--tile-vw', String(root.clientWidth))
    root.style.setProperty('--tile-vh', String(largeViewportHeight()))
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
