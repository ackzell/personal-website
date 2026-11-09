/** Pointer distance (px) around the submenu that counts as "in range". */
const REVEAL_RANGE = 48
/** Each label's wait per step out from the ripple's origin, and its fade in (SiteFlagNav's reveal styles); heard half way in. */
const RIPPLE_STEP = 0.06
const LABEL_IN = 0.2

interface SubmenuRevealOptions {
  /** The open section's submenu list, if there is one. */
  submenu: () => HTMLElement | null | undefined
  /** Whether the current route is a section's own page (About, Work, Media). */
  isSectionPage: () => boolean
  /** Index of the current page among the submenu's items, or -1. */
  currentIndex: () => number
}

/**
 * When the flag band's submenu labels show (see "reveal" in SiteFlagNav).
 * One idea: labels show while you're looking, and get out of the way once
 * you've found it.
 *
 * - Pointer within range: labels ripple in from the item nearest the pointer
 *   (`rippleOrigin`), spreading both ways. The origin is fixed on entry.
 * - Pointer out of range, or out of the window: they hide.
 * - Picking a page under a section: the rest hide, and stay hidden while the
 *   pointer rests on the picked item, until it moves to a sibling or leaves.
 * - Opening a section: its children render hidden (a transition needs a state
 *   to leave), then ripple in from the section's link halfway through the
 *   page transition, as the new page settles.
 *
 * Pointer devices only; the styles gate the hiding the same way.
 */
export function useSubmenuReveal({ submenu, isSectionPage, currentIndex }: SubmenuRevealOptions) {
  const route = useRoute()
  const reveal = ref(false)
  const rippleOrigin = ref(0)
  /** The picked item while the pointer rests on it. */
  let settled: number | null = null
  let frame = 0
  let revealTimer: ReturnType<typeof setTimeout> | undefined

  function onPointerMove(event: PointerEvent) {
    if (frame) return
    const { clientX: x, clientY: y } = event
    frame = requestAnimationFrame(() => {
      frame = 0
      const list = submenu()
      if (!list) return
      const box = list.getBoundingClientRect()
      const near =
        x > box.left - REVEAL_RANGE && x < box.right + REVEAL_RANGE &&
        y > box.top - REVEAL_RANGE && y < box.bottom + REVEAL_RANGE
      const nearest = () => {
        const distances = [...list.children].map((item) => {
          const { left, width } = item.getBoundingClientRect()
          return Math.abs(x - (left + width / 2))
        })
        return distances.indexOf(Math.min(...distances))
      }
      if (settled !== null) {
        if (near && nearest() === settled) return
        settled = null
        if (!near) return
      }
      if (near === reveal.value) return
      if (near) {
        rippleOrigin.value = nearest()
        heardFrom(list, rippleOrigin.value)
      }
      reveal.value = near
    })
  }

  /* Each label heard as it shows, where it is on screen, out from `origin`.
     Only for the mouse coming near: opening a section already has the page
     change's sounds. */
  function heardFrom(list: HTMLElement, origin: number) {
    const labels = [...list.children].map((item, i) => {
      const { left, width } = item.getBoundingClientRect()
      const step = Math.abs(i - origin)
      return { step, at: step * RIPPLE_STEP + LABEL_IN / 2, pan: ((left + width / 2) / innerWidth * 2 - 1) * 0.7 }
    })
    soundLabels(labels)
  }

  const onPointerLeave = () => (reveal.value = false)

  function revealSection() {
    reveal.value = false
    settled = null
    rippleOrigin.value = 0
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pageTransition = cssTime('--page-transition')
    revealTimer = setTimeout(() => (reveal.value = true), reduce ? 0 : (pageTransition || 0) / 2)
  }

  watch(() => route.fullPath, () => {
    clearTimeout(revealTimer)
    if (isSectionPage()) return revealSection()
    if (!reveal.value) return
    reveal.value = false
    const picked = currentIndex()
    settled = picked === -1 ? null : picked
  })

  onMounted(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    document.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('pointermove', onPointerMove)
    document.documentElement.removeEventListener('pointerleave', onPointerLeave)
    cancelAnimationFrame(frame)
    clearTimeout(revealTimer)
  })

  return { reveal, rippleOrigin }
}
