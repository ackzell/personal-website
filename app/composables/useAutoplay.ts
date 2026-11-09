/**
 * Whether a clip may start on its own: not under reduced motion, and not on a
 * connection that says it's slow or metered (Save-Data, 2G/3G), where a loop
 * would cost megabytes nobody asked for. Tapping play still plays.
 * shortcut: navigator.connection is missing in Safari/Firefox, so there it's
 * always allowed; the clips are kept small for that reason.
 */
export function useAutoplay() {
  const reducedMotion = usePreferredReducedMotion()
  const { saveData, effectiveType } = useNetwork()
  return computed(() => reducedMotion.value !== 'reduce' && !saveData.value
    && !['slow-2g', '2g', '3g'].includes(effectiveType.value ?? ''))
}
