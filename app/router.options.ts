import type { RouterConfig } from '@nuxt/schema'
import { START_LOCATION, type RouteLocationNormalized } from 'vue-router'
import { trackPageScroll } from '~/utils/pageScroll'
import { isLocaleSwitch } from '~/utils/localeSwitch'

/*
 * Nuxt's default scroll behavior (wait for the page transition, restore saved
 * positions, honor hashes), with one change: on small screens, when the brand
 * row has already scrolled away, fully or partly (--header-tuck, SiteHeader),
 * a new page opens with it just as far tucked instead of at the very top, so
 * the header doesn't jump back.
 */
const samePath = (a: RouteLocationNormalized, b: RouteLocationNormalized) =>
  a.path.replace(/\/$/, '') === b.path.replace(/\/$/, '')

function hashTop(selector: string) {
  try {
    const el = document.querySelector(selector)
    if (!el) return 0
    return (parseFloat(getComputedStyle(el).scrollMarginTop) || 0)
      + (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0)
  } catch {
    return 0
  }
}

/**
 * How much of the brand row is tucked away on a small screen, else 0. Keeping
 * a partial tuck too means the band never drops mid-transition.
 */
function tuckedTop() {
  if (!window.matchMedia('(width < 40rem)').matches) return 0
  const tuck = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-tuck')) || 0
  return Math.min(window.scrollY, tuck)
}

/**
 * The page view transition in flight, from Nuxt's own hook rather than
 * :active-view-transition, which Safari before 18.2 doesn't know. Nuxt starts
 * it in beforeResolve, before scrollBehavior runs; the hook goes on during
 * the first (hydration) call, ahead of any transition.
 */
let viewTransition: ViewTransition | null = null
let tracking = false

function trackViewTransitions() {
  if (tracking) return
  tracking = true
  useNuxtApp().hook('page:view-transition:start', (transition) => {
    viewTransition = transition
    // How far the page scrolled between the snapshots, so the old page can
    // fade where it was instead of sliding in from its scroll (main.css).
    const root = document.documentElement
    const from = window.scrollY
    transition.ready.then(() => root.style.setProperty('--page-shift', `${window.scrollY - from}px`), () => {})
    transition.finished.finally(() => {
      if (viewTransition !== transition) return
      viewTransition = null
      root.style.removeProperty('--page-shift')
    })
  })
}

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    trackViewTransitions()
    // A language switch turns the page over in place (locale-scramble): stay put.
    if (isLocaleSwitch(to, from)) return false
    if (samePath(to, from)) {
      if (from.hash && !to.hash) return savedPosition ?? { left: 0, top: 0 }
      if (to.hash) return { el: to.hash, top: hashTop(to.hash), behavior: 'auto' }
      return false
    }

    // Read before the old page leaves, while scrollY is still the visitor's.
    const top = from === START_LOCATION ? 0 : tuckedTop()
    const position = () => {
      if (savedPosition) return savedPosition
      if (to.hash) return { el: to.hash, top: hashTop(to.hash) }
      return { left: 0, top }
    }

    if (from === START_LOCATION) return position()

    const nuxtApp = useNuxtApp()
    const router = useRouter()
    // In a view transition the old page is already a still snapshot, so the
    // scroll can't be seen: to the top, make it now. Waiting for the new page
    // is too late in Safari, which takes its snapshot before the router
    // scrolls; the header shows untucked and then slides up into place.
    if (viewTransition && !savedPosition && !to.hash) {
      const scroll = Promise.resolve(position())
      trackPageScroll(scroll)
      return scroll
    }
    // A saved position or a hash needs the new page's height, so it scrolls
    // as soon as the new page is in, before its snapshot is taken (Chromium).
    if (viewTransition) {
      const scroll = new Promise<ReturnType<typeof position> | false>((resolve) => {
        nuxtApp.hooks.hookOnce('page:finish', () =>
          resolve(router.currentRoute.value.fullPath === to.fullPath ? position() : false))
      })
      trackPageScroll(scroll)
      return scroll
    }
    const scroll = new Promise<ReturnType<typeof position> | false>((resolve) => {
      nuxtApp.hooks.hookOnce('page:loading:end', () => {
        const done = () => requestAnimationFrame(() =>
          resolve(router.currentRoute.value.fullPath === to.fullPath ? position() : false))
        const transition = (nuxtApp as { '~transitionPromise'?: Promise<void> })['~transitionPromise']
        if (transition) transition.then(done)
        else done()
      })
    })
    trackPageScroll(scroll)
    return scroll
  },
}
