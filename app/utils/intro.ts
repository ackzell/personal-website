/** Set once a browser has seen the first-visit intro (plugins/intro.client.ts). */
export const INTRO_SEEN = 'intro-seen'

/**
 * On a first visit, ms until the header and footer start building (main.css,
 * "First visit"), on the page load's clock; 0 once built or on any other visit.
 */
export function introLeft() {
  const root = document.documentElement
  if (root.dataset.intro !== '') return 0
  return Math.max(0, Number.parseFloat(getComputedStyle(root).getPropertyValue('--intro-at')) - performance.now())
}
