import type { MaybeRefOrGetter } from 'vue'

/** How far the pointer moves before a press becomes a drag, in px. */
const THRESHOLD = 5

/**
 * Drag a sideways-scrolling list with the mouse, the way touch already
 * scrolls it. Listens on `root` and drags whichever `selector` element the
 * press lands in, so the list can come and go (v-if) without rebinding.
 *
 * A press that barely moves is still a click. Once it moves past the
 * threshold it's a drag: scroll snapping pauses so it doesn't fight the
 * pointer, and the click that ends the drag is swallowed so a link under the
 * pointer doesn't navigate. Touch and pen keep their native scrolling.
 */
export function useDragScroll(root: MaybeRefOrGetter<HTMLElement | null | undefined>, selector: string) {
  let list: HTMLElement | null = null
  let pointerId = -1
  let startX = 0
  let startScroll = 0
  let dragging = false

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    const target = (event.target as Element).closest<HTMLElement>(selector)
    if (!target || target.scrollWidth <= target.clientWidth) return
    list = target
    pointerId = event.pointerId
    startX = event.clientX
    startScroll = target.scrollLeft
    dragging = false
  }

  function onPointerMove(event: PointerEvent) {
    if (!list || event.pointerId !== pointerId) return
    const dx = event.clientX - startX
    if (!dragging) {
      if (Math.abs(dx) < THRESHOLD) return
      dragging = true
      list.setPointerCapture(pointerId)
      list.dataset.dragging = ''
    }
    list.scrollLeft = startScroll - dx
  }

  function onPointerUp(event: PointerEvent) {
    if (!list || event.pointerId !== pointerId) return
    if (dragging) {
      delete list.dataset.dragging
      // Swallow the click this release is about to fire, then stop listening.
      const swallow = (click: MouseEvent) => {
        click.preventDefault()
        click.stopPropagation()
      }
      window.addEventListener('click', swallow, { capture: true, once: true })
      setTimeout(() => window.removeEventListener('click', swallow, { capture: true }))
    }
    list = null
    pointerId = -1
    dragging = false
  }

  // Native link dragging (the ghost URL) would take over the press.
  function onDragStart(event: DragEvent) {
    if ((event.target as Element).closest?.(selector)) event.preventDefault()
  }

  useEventListener(root, 'pointerdown', onPointerDown)
  useEventListener(root, 'pointermove', onPointerMove)
  useEventListener(root, ['pointerup', 'pointercancel'], onPointerUp)
  useEventListener(root, 'dragstart', onDragStart)
}
