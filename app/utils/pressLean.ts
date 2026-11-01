/**
 * Where a press lands on a link's words, from -1 (their start) to 1 (their
 * end), set as --press-x on the words (the element matching `words` inside
 * the link) for them to lean in there. Bound to pointerdown and pointermove,
 * so a finger sliding along them while held carries the lean with it.
 * The lean itself is each component's CSS, on :active.
 */
export function pressLean(event: PointerEvent, words: string) {
  if (event.type === 'pointermove' && !event.buttons) return
  const text = (event.currentTarget as HTMLElement).querySelector<HTMLElement>(words)
  if (!text) return
  const box = text.getBoundingClientRect()
  if (!box.width) return
  const x = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width - 0.5) * 2))
  text.style.setProperty('--press-x', x.toFixed(3))
}
