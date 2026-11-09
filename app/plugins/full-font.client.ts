/*
 * Recursive with every axis the site uses (adds slnt and CRSV, the hover lean
 * into cursive forms), twice the size of the one the page first loads with.
 * Fetched once the page and its images are in and the browser is idle, so on
 * a slow connection it never stands in front of them; main.css names it
 * first, and it takes over the moment it's ready. Same glyphs at rest, so the
 * swap doesn't show. Ranges and files from Google Fonts' css2 for v44.
 */
const FACES = [
  {
    file: 'recursive-full-v44-latin.woff2',
    range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  },
  {
    file: 'recursive-full-v44-latin-ext.woff2',
    range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
  },
]

export default defineNuxtPlugin(() => {
  const base = useRuntimeConfig().app.baseURL
  const idle = window.requestIdleCallback ?? ((then: () => void) => setTimeout(then, 300))
  const add = () => idle(() => {
    for (const { file, range } of FACES) {
      // Fetched when text needs its range (latin-ext rarely); while it loads,
      // swap keeps the text in the next family in line, the first Recursive.
      document.fonts.add(new FontFace('Recursive Full', `url(${base}fonts/${file}) format('woff2')`, {
        weight: '300 700',
        unicodeRange: range,
        display: 'swap',
      }))
    }
  })
  if (document.readyState === 'complete') add()
  else window.addEventListener('load', add, { once: true })
})
