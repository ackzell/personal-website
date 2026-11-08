/*
 * A first visit ever: the page comes in on its own, then the header and
 * footer build around it (main.css, "First visit"), so each gets looked at
 * in turn. The <head> script in nuxt.config.ts marks the visit before the
 * first paint (data-intro); this only keeps time: "build" at --intro-at,
 * "done" once built, kept so nothing replays its everyday entrance after
 * the build's own. Any press, key or scroll shows everything at once.
 * `ackzell.intro` in the console forgets the visit (plugins/console.client.ts).
 */
// The last of the build to settle (the scheme switch's light), in main.css.
const BUILD = 3500

export default defineNuxtPlugin(() => {
  const root = document.documentElement
  if (root.dataset.intro !== '') return
  try {
    localStorage.setItem(INTRO_SEEN, '1')
  } catch {
    // Storage blocked: the head script never marks the visit then.
  }

  const stop = new AbortController()
  let timer = setTimeout(() => {
    root.dataset.intro = 'build'
    timer = setTimeout(end, BUILD)
  }, introLeft())
  function end() {
    stop.abort()
    clearTimeout(timer)
    root.dataset.intro = 'done'
  }
  for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
    addEventListener(type, end, { signal: stop.signal, passive: true, capture: true })
  }
})
