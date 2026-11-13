import { animate, useMotionValue, useMotionValueEvent, useSpring, useTransform, useVelocity, type Transition } from 'motion-v'

/*
 * The media guide's preview card (GuideSeries): one for the whole guide, so
 * moving to the next cell swaps its picture rather than its box. A mouse
 * carries it just above the pointer; a finger steps it from cell to cell.
 *
 * It rides springs: it trails the pointer a hair and swings as it goes, its
 * top leaning back against the way it's moving (hung from the pointer, at
 * its foot), and rights itself as it comes to rest. It stops without
 * overshooting, and the lean has a spring of its own, so it eases upright
 * rather than snapping back when the card stops.
 */
const FOLLOW: Transition = { type: 'spring', bounce: 0, visualDuration: 0.22 }
const STEP: Transition = { type: 'spring', bounce: 0, visualDuration: 0.28 }
const EDGE = 12

export function useGuideCard(card: Readonly<Ref<HTMLElement | null>>, reducedMotion: Readonly<Ref<boolean>>) {
  const at = { x: useMotionValue(0), y: useMotionValue(0) }
  // Moving right at this speed (px/s) leans it the most, back to the left.
  const lean = useTransform(useVelocity(at.x), [-3200, 0, 3200], [5, 0, -5], { clamp: true })
  const swing = useSpring(lean, { bounce: 0, visualDuration: 0.2 })
  // Off screen, it appears where it belongs rather than gliding in.
  const placed = ref(false)

  // Written straight to the card each frame, outside Vue.
  function paint() {
    const element = card.value
    if (!element) return
    element.style.translate = `${at.x.get()}px ${at.y.get()}px`
    element.style.rotate = reducedMotion.value ? '' : `${swing.get()}deg`
  }
  useMotionValueEvent(at.x, 'change', paint)
  useMotionValueEvent(at.y, 'change', paint)
  useMotionValueEvent(swing, 'change', paint)

  /** Centered over `x`, above `above` if it fits under the header, else below `below`. */
  async function aim(x: number, above: number, below: number, touch: boolean) {
    await nextTick()
    const element = card.value
    if (!element) return
    const header = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0
    const { offsetWidth: width, offsetHeight: height } = element
    const to = {
      x: Math.min(Math.max(EDGE, x - width / 2), window.innerWidth - width - EDGE),
      y: above - height - EDGE >= header + EDGE ? above - height - EDGE : below + EDGE,
    }
    if (!placed.value || reducedMotion.value) {
      at.x.jump(to.x)
      at.y.jump(to.y)
      paint()
    } else {
      const spring = touch ? STEP : FOLLOW
      animate(at.x, to.x, spring)
      animate(at.y, to.y, spring)
    }
    requestAnimationFrame(() => {
      placed.value = true
    })
  }

  /*
   * The still on the card. The one on show stays until the next has loaded
   * and decoded, so a swap is never an empty box; a sweep passes cells by, and
   * only the one it rests on for a beat is fetched.
   */
  const ready = new Set<string>()
  const still = ref<string>()
  const wanted = ref<string>()
  let fetchTimer: ReturnType<typeof setTimeout> | undefined
  function want(id: string) {
    const src = youtubeStill(id)
    wanted.value = src
    clearTimeout(fetchTimer)
    if (ready.has(src)) {
      still.value = src
      return
    }
    fetchTimer = setTimeout(() => {
      const image = new Image()
      image.src = src
      image.decode().catch(() => {}).then(() => {
        ready.add(src)
        if (wanted.value === src) still.value = src
      })
    }, 60)
  }

  return { placed, aim, still, wanted, want }
}
