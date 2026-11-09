/**
 * A CSS time ("550ms", "0.55s") in ms, or NaN. Read times through this, not
 * parseFloat: the production build's minifier rewrites 550ms as .55s.
 */
export const toMs = (time: string) => {
  const n = Number.parseFloat(time)
  return /\ds\s*$/.test(time) && !/ms\s*$/.test(time) ? n * 1000 : n
}

/** A custom property holding a time, from the root, in ms (NaN if unset). */
export const cssTime = (name: string) => toMs(getComputedStyle(document.documentElement).getPropertyValue(name))
