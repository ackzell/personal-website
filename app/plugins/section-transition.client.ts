import { sectionOf, sectionOrder } from '~/composables/useSection'

/**
 * Tags each page view transition with where it travels along the flag:
 * `section-forward` / `section-back` when the section changes, `section-same`
 * otherwise. The CSS in main.css picks the animation from the type.
 * Nuxt already skips view transitions under prefers-reduced-motion.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const routeBaseName = useRouteBaseName()
  let type = 'section-same'

  router.beforeEach((to, from) => {
    const delta =
      sectionOrder.indexOf(sectionOf(routeBaseName(to))) - sectionOrder.indexOf(sectionOf(routeBaseName(from)))
    type = delta > 0 ? 'section-forward' : delta < 0 ? 'section-back' : 'section-same'
  })

  nuxtApp.hook('page:view-transition:start', (transition) => {
    // ViewTransition.types is missing in browsers without VT types; those get
    // the default crossfade.
    transition.types?.add(type)
  })
})
