/**
 * A screen that switches on as it comes into view. Bind it to `data-power` on
 * an ancestor of a `.power-screen` (main.css draws the switch-on).
 *
 * It starts `auto`: CSS switches the screen on as soon as the page paints,
 * with the page's own entrance, never waiting on JS. Once mounted, a screen
 * that's still below the fold goes `off` and switches `on` the first time a
 * third of it is on screen; one already in view is left as it is.
 *
 * Without JS, a <noscript> style (nuxt.config.ts) keeps it simply lit.
 */
export function usePowerOn(target: MaybeRefOrGetter<HTMLElement | null | undefined>) {
  const power = ref<'auto' | 'off' | 'on'>('auto')

  const { stop, resume } = useIntersectionObserver(target, ([entry]) => {
    if (!entry?.isIntersecting) return
    power.value = 'on'
    stop()
  }, { threshold: 0.33, immediate: false })

  onMounted(() => {
    const el = toValue(target)
    if (!el || el.getBoundingClientRect().top < window.innerHeight) return
    power.value = 'off'
    resume()
  })

  return power
}
