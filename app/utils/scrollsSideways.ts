/** Whether an element, or something holding it, scrolls sideways (the band's own stops, a carousel). */
export function scrollsSideways(el: Element | null) {
  for (; el && el !== document.body; el = el.parentElement) {
    if (el.scrollWidth <= el.clientWidth) continue
    const { overflowX } = getComputedStyle(el)
    if (overflowX === 'auto' || overflowX === 'scroll') return true
  }
  return false
}
