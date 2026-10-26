import { mainNav } from '~/config/nav'

/** How far the finger travels sideways before a swipe counts, in px. */
const DISTANCE = 60
/** Longer than this it's a slow drag or a read, not a swipe, in ms. */
const DURATION = 600
/** Presses this close to a screen edge belong to the browser's own back/forward. */
const EDGE = 24

/**
 * Swipe sideways on a touch screen to step through the flag band in order:
 * each section, then the pages under it (projects under Work, the children
 * under Media). Finger to the left goes forward, to the right goes back, the
 * way a page turns. Stops at either end.
 *
 * A swipe that starts in something that scrolls sideways (the band's own
 * stops, a carousel) scrolls that instead. Mostly-vertical moves are scrolls.
 * While a modal is up (a lightbox), its swipes are its own.
 */
export function useSwipeNav() {
  const route = useRoute()
  const router = useRouter()
  const localePath = useLocalePath()
  const { data: projects } = useProjects()

  const stops = computed(() =>
    mainNav.flatMap((item) => [
      item.to,
      ...(item.section === 'work' ? (projects.value ?? []).map((project) => `/projects/${project.slug}`) : []),
      ...('children' in item ? item.children.map((child) => child.to) : []),
    ]),
  )

  const stripSlash = (path: string) => (path.length > 1 ? path.replace(/\/$/, '') : path)

  function step(by: 1 | -1) {
    const here = stripSlash(route.path)
    const i = stops.value.findIndex((to) => stripSlash(localePath(to)) === here)
    const next = i === -1 ? undefined : stops.value[i + by]
    if (next) router.push(localePath(next))
  }

  function scrollsSideways(el: Element | null) {
    for (; el && el !== document.body; el = el.parentElement) {
      if (el.scrollWidth <= el.clientWidth) continue
      const { overflowX } = getComputedStyle(el)
      if (overflowX === 'auto' || overflowX === 'scroll') return true
    }
    return false
  }

  let start: { x: number; y: number; time: number } | undefined

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    start = undefined
    if (event.touches.length !== 1 || !touch) return
    if (touch.clientX < EDGE || touch.clientX > window.innerWidth - EDGE) return
    if (scrollsSideways(event.target as Element)) return
    if (document.querySelector(':modal')) return
    start ={ x: touch.clientX, y: touch.clientY, time: event.timeStamp }
  }

  function onTouchEnd(event: TouchEvent) {
    const touch = event.changedTouches[0]
    if (!start || !touch) return
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    const quick = event.timeStamp - start.time < DURATION
    start = undefined
    // Mostly sideways, far enough, and not while text is being selected.
    if (!quick || Math.abs(dx) < DISTANCE || Math.abs(dx) < Math.abs(dy) * 2) return
    if (!document.getSelection()?.isCollapsed) return
    step(dx < 0 ? 1 : -1)
  }

  useEventListener(document, 'touchstart', onTouchStart, { passive: true })
  useEventListener(document, 'touchend', onTouchEnd, { passive: true })
  useEventListener(document, 'touchcancel', () => (start = undefined), { passive: true })
}
