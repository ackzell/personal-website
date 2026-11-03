/*
 * The media guide's entrance (GuideSeries): each strip draws itself in, a row
 * after the one above. Rows on screen from the start draw as the page arrives
 * (their animation is in the server's markup, so nothing flashes on load).
 * Rows below draw as they're scrolled up the screen, tied to the scroll (CSS
 * scroll-driven animations), so scrolling back undraws them. Where that isn't
 * supported they wait out of sight and draw once they're well in, in the
 * order they came up. Rows are `.guide__row[data-row]` inside `root`.
 */

// Without scroll-driven animations: how far up from the bottom of the screen
// a row's top has to come before it draws.
const REVEAL_AT = 0.3
// A drawn-by-scroll row finishes this far (screens) after its top comes up.
// One too near the page's end to be scrolled that far has its whole
// sequence squeezed (--fit) to finish just before the bottom; measured again
// as the page changes height (a list opened, a turned phone).
const REVEAL_SPAN = 0.68

export function useGuideReveal(root: Readonly<Ref<HTMLElement | null>>, reducedMotion: Readonly<Ref<boolean>>) {
  const rowsIn = () => [...root.value?.querySelectorAll<HTMLElement>('.guide__row[data-row]') ?? []]
  /** Rows drawn by the scroll. */
  const linked = ref(new Set<string>())
  /** Rows waiting to come into view (no scroll-driven animations). */
  const waiting = ref(new Set<string>())
  /** The order waiting rows came up in, for their stagger. */
  const order = ref<Record<string, number>>({})
  /** How much a linked row near the page's end has its sequence squeezed. */
  const fit = ref<Record<string, number>>({})

  function measureFit() {
    const screen = window.innerHeight
    // A row's timeline starts once its top clears the page's scroll padding
    // (room left for the footer), not the very bottom of the screen.
    const end = document.documentElement.scrollHeight - (Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom) || 0)
    const next: Record<string, number> = {}
    for (const element of rowsIn()) {
      if (!linked.value.has(element.dataset.row!)) continue
      const room = (end - element.getBoundingClientRect().top - window.scrollY) / screen - 0.06
      if (room < REVEAL_SPAN) next[element.dataset.row!] = Math.max(0.3, room / REVEAL_SPAN)
    }
    fit.value = next
  }
  const page = shallowRef<HTMLElement>()
  useResizeObserver(page, measureFit)

  let arrivals: IntersectionObserver | undefined
  onMounted(() => {
    if (reducedMotion.value) return
    const scrollDriven = CSS.supports('animation-timeline: view()')
    // Measured from the page's top: a new page arrives scrolled there.
    const line = window.innerHeight * (scrollDriven ? 1 : 1 - REVEAL_AT)
    const below = rowsIn().filter((element) => element.getBoundingClientRect().top + window.scrollY > line)
    if (!below.length) return
    const ids = new Set(below.map((element) => element.dataset.row!))
    if (scrollDriven) {
      linked.value = ids
      page.value = document.documentElement
      return
    }
    waiting.value = ids
    arrivals = new IntersectionObserver((entries) => {
      const next = new Set(waiting.value)
      let batch = 0
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue
        const id = (target as HTMLElement).dataset.row!
        order.value[id] = batch++
        next.delete(id)
        arrivals!.unobserve(target)
      }
      waiting.value = next
    }, { rootMargin: `0px 0px -${REVEAL_AT * 100}% 0px` })
    below.forEach((element) => arrivals!.observe(element))
  })
  onBeforeUnmount(() => arrivals?.disconnect())

  return { linked, waiting, order, fit }
}
