/**
 * The finger feels a bar catch at the top of the screen: anything marked
 * `data-stick` (a position: sticky element) gives a haptic as it comes to
 * rest at its sticky offset, scrolled there. Not as it lets go, and not for
 * what's already resting there when it turns up (a page arriving).
 *
 * One listener for the whole site, in the layout. Scrolls in anything count
 * (capture), so a sticky element in a sheet catches too.
 */
export function useStickFeel() {
  const stuck = new WeakMap<Element, boolean>()
  let frame = 0

  function check() {
    frame = 0
    for (const el of document.querySelectorAll<HTMLElement>('[data-stick]')) {
      // Some stick only on some screens (a clip pinned on phones).
      const style = getComputedStyle(el)
      const top = Number.parseFloat(style.insetBlockStart)
      if (style.position !== 'sticky' || Number.isNaN(top)) continue
      const now = Math.abs(el.getBoundingClientRect().top - top) < 1 && el.checkVisibility()
      const was = stuck.get(el)
      stuck.set(el, now)
      if (now && was === false) haptic('stick')
    }
  }

  useEventListener('scroll', () => {
    frame ||= requestAnimationFrame(check)
  }, { passive: true, capture: true })
}
