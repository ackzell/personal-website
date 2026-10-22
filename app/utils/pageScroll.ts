/**
 * The scroll a navigation is about to make (router.options.ts). A page that
 * measures what is on screen at mount (rows waiting to scroll in) waits for
 * it: until then the window is still scrolled where the old page was.
 */
let pending: Promise<void> | undefined

export function trackPageScroll(scroll: Promise<unknown>) {
  // The router scrolls once scrollBehavior resolves; a frame later it's done.
  const settled = scroll.then(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))
  pending = settled
  settled.finally(() => {
    if (pending === settled) pending = undefined
  })
}

export const pageScrolled = () => pending ?? Promise.resolve()
