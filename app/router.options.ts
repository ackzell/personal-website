import type { RouterConfig } from '@nuxt/schema'
import { START_LOCATION, type RouteLocationNormalized } from 'vue-router'

/*
 * Nuxt's default scroll behavior (wait for the page transition, restore saved
 * positions, honor hashes), with one change: on small screens, when the brand
 * row has already scrolled away (--header-tuck, SiteHeader), a new page opens
 * just under it instead of at the very top, so the header doesn't jump back.
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

/** The brand row's height when it's tucked away on a small screen, else 0. */
function tuckedTop() {
  if (!window.matchMedia('(width < 40rem)').matches) return 0
  const tuck = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-tuck')) || 0
  return window.scrollY >= tuck ? tuck : 0
}

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
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
    return new Promise((resolve) => {
      nuxtApp.hooks.hookOnce('page:loading:end', () => {
        const done = () => requestAnimationFrame(() =>
          resolve(router.currentRoute.value.fullPath === to.fullPath ? position() : false))
        const transition = (nuxtApp as { '~transitionPromise'?: Promise<void> })['~transitionPromise']
        if (transition) transition.then(done)
        else done()
      })
    })
  },
}
