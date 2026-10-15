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
    transition.ready.then(slideMarkerAlongBand).catch(() => {})
  })
})

const MARKER_GROUP = '::view-transition-group(flag-marker)'

/*
 * The marker's group animates from its old screen position to its new one.
 * When the header sits higher or lower in the new snapshot (the brand row
 * tucked away, or the scroll clamped by a shorter page), that becomes a
 * diagonal hop. The new band is already in place, so the marker starts on
 * its row and only slides along it.
 */
function slideMarkerAlongBand() {
  const effect = document.getAnimations()
    .map((animation) => animation.effect)
    .find((effect): effect is KeyframeEffect => effect instanceof KeyframeEffect && effect.pseudoElement === MARKER_GROUP)
  if (!effect) return

  const end = getComputedStyle(document.documentElement, MARKER_GROUP).transform
  if (!end || end === 'none') return
  const row = new DOMMatrix(end).m42

  effect.setKeyframes(effect.getKeyframes().map((frame) => {
    if (typeof frame.transform !== 'string' || frame.transform === 'none') return frame
    const matrix = new DOMMatrix(frame.transform)
    matrix.m42 = row
    return { ...frame, transform: matrix.toString() }
  }))
}
