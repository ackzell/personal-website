import { pressAt } from '~/utils/pageArrival'

/** Where the keys belong to what has focus: fields, and widgets that step with arrows of their own. */
const OWNS_ARROWS = [
  'input',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  'video',
  'audio',
  'dialog',
  ...['tablist', 'listbox', 'slider', 'radiogroup', 'menu', 'menubar', 'grid', 'toolbar', 'tree'].map((role) => `[role="${role}"]`),
].join(',')

/**
 * ← and → step through the flag band's stops, as a swipe does on a touch
 * screen: → goes forward, ← back, stopping at either end. The page comes in
 * from the screen's edge on the side it lies on.
 *
 * Only the bare keys, pressed once (held, they don't run on through the
 * stops), and only while nothing else wants them: a field, a widget with
 * arrows of its own (the band, a palette, a lightbox), or something that
 * scrolls sideways.
 */
export function useKeyNav() {
  const route = useRoute()
  const router = useRouter()
  const localePath = useLocalePath()
  const { from } = useNavStops()

  useEventListener(document, 'keydown', (event: KeyboardEvent) => {
    const way = ({ ArrowRight: 1, ArrowLeft: -1 } as const)[event.key as 'ArrowRight' | 'ArrowLeft']
    if (!way || event.defaultPrevented || event.repeat || event.isComposing) return
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const target = event.target as Element
    if (target.closest?.(OWNS_ARROWS) || scrollsSideways(target) || document.querySelector(':modal')) return
    const next = from(route.path, way)
    if (!next) return
    event.preventDefault()
    pressAt({ x: way > 0 ? document.documentElement.clientWidth : 0, y: window.innerHeight / 2 })
    router.push(localePath(next.to))
  })
}
