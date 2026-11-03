import { animate } from 'motion-v'

/*
 * Folds `panel` up into `section` and, if the section's top has gone off the
 * top of the screen, scrolls back to it alongside: you come back to where you
 * opened it. Only paint moves while it folds (the panel clips away, what's
 * below slides up); the page is laid out once, at the end, when `close` takes
 * the panel out and everything is already where that puts it. Where that is
 * gets measured first, with the panel taken out for a moment: the footer may
 * only come part way (a short page holds it to the bottom of the screen), and
 * the scroll is brought within the shorter page as it folds, so the browser
 * never has to pull it in afterwards.
 */
export async function foldAway(section: HTMLElement, panel: HTMLElement, close: () => void) {
  // Everything after the section on the page, skipping what's fixed to the screen.
  const below: HTMLElement[] = []
  for (let at: HTMLElement | null = section; at && at !== document.body; at = at.parentElement) {
    for (let next = at.nextElementSibling; next; next = next.nextElementSibling) {
      if (next instanceof HTMLElement && getComputedStyle(next).position !== 'fixed') below.push(next)
    }
  }
  const html = document.documentElement
  const before = below.map((element) => element.getBoundingClientRect().top)
  panel.style.display = 'none'
  const after = below.map((element) => element.getBoundingClientRect().top)
  const last = html.scrollHeight - html.clientHeight
  panel.style.removeProperty('display')

  const from = window.scrollY
  const top = section.getBoundingClientRect().top
  const pad = Number.parseFloat(getComputedStyle(html).scrollPaddingTop) || 0
  const back = top < pad ? from + top - pad - (Number.parseFloat(getComputedStyle(section).scrollMarginBlockStart) || 0) : from
  const to = Math.max(0, Math.min(back, last))

  const fold = { duration: 0.32, ease: [0.32, 0.72, 0, 1] } as const
  await Promise.all([
    animate(panel, { clipPath: ['inset(0 0 0 0)', 'inset(0 0 100% 0)'], opacity: [1, 0] }, fold),
    ...below.map((element, i) => animate(element, { y: [0, after[i]! - before[i]!] }, fold)),
    to !== from && animate(from, to, { ...fold, onUpdate: (y) => window.scrollTo({ top: y, behavior: 'instant' }) }),
  ])
  close()
  await nextTick()
  // Same frame as the panel leaving the layout, so nothing moves.
  for (const element of [panel, ...below]) {
    element.style.removeProperty('transform')
    element.style.removeProperty('clip-path')
    element.style.removeProperty('opacity')
  }
}
