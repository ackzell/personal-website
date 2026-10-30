import { arrive, isArriving, startChange, type Point } from '~/utils/pageArrival'
import { sectionOf, sectionOrder } from '~/composables/useSection'

/**
 * Every page change brings the new page in the same way (utils/pageArrival):
 * block by block, from the side it lies on along the flag band, nearest
 * where the visitor acted first. Within a section the new page's snapshot
 * holds still while its blocks come in under it (it's live); across sections
 * they come in under the tiles, as the slabs over them open.
 *
 * `data-way` tells main.css which way the pages go, for the layers the
 * blocks can't carry (the old page, words and plates of their own). Nuxt
 * skips view transitions under reduced motion, so nothing here runs then.
 */
export function usePageArrival() {
  const router = useRouter()
  const routeBaseName = useRouteBaseName()
  const { indexOf } = useNavStops()
  const root = import.meta.client ? document.documentElement : undefined

  let next: { way: number; from: Point } | undefined

  router.beforeEach((to, from) => {
    const target = sectionOf(routeBaseName(to))
    const bySection = sectionOrder.indexOf(target) - sectionOrder.indexOf(sectionOf(routeBaseName(from)))
    const [a, b] = [indexOf(from.path), indexOf(to.path)]
    const byStop = a !== -1 && b !== -1 ? b - a : 0
    next = { way: Math.sign(bySection || byStop), from: startChange(target) }
  })

  useNuxtApp().hook('page:view-transition:start', (transition) => {
    const change = next
    next = undefined
    if (!change || !root) return
    const tiles = !transition.types?.has('section-same') && root.classList.contains('has-tile-wipe')
    if (change.way) root.dataset.way = change.way > 0 ? 'forward' : 'back'
    transition.updateCallbackDone.finally(() => {
      root.dataset.arriving = ''
    })
    transition.ready.then(
      () => {
        // Nothing off the side to scroll to while blocks come in from there,
        // and a page that grew wider would cut the view transition short.
        root.dataset.landing = ''
        const landed = arrive({ ...change, tiles })
        delete root.dataset.arriving
        landed.then(() => {
          if (!isArriving()) delete root.dataset.landing
        })
      },
      () => {},
    )
    transition.finished.finally(() => {
      delete root.dataset.arriving
      delete root.dataset.way
    })
  })
}
