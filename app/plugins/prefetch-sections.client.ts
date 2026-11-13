import { mainNav } from '~/config/nav'

/*
 * Every page on the flag nav is fetched ahead (its code and payload, the way
 * a NuxtLink in view is), once the page in front is up, so a tap on the band
 * finds the next page already here and the change is instant. A link only
 * prefetches itself in view, and the band's stops can be scrolled out of it
 * on a phone. Repeats after each change, for the other locale's paths.
 */
const paths = mainNav.flatMap((item) => [item.to, ...('children' in item ? item.children.map((child) => child.to) : [])])

export default defineNuxtPlugin((nuxtApp) => {
  const localePath = useLocalePath()
  const warmed = new Set<string>()
  const idle = window.requestIdleCallback ?? ((then: () => void) => setTimeout(then, 300))

  const warm = () => {
    for (const to of paths) {
      const path = localePath(to)
      if (warmed.has(path)) continue
      warmed.add(path)
      preloadRouteComponents(path).catch(() => {})
      nuxtApp.callHook('link:prefetch', path)?.catch(() => {})
    }
  }
  onNuxtReady(() => idle(warm))
  nuxtApp.hook('page:finish', () => { idle(warm) })
})
