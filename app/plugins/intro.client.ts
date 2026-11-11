/*
 * A first visit ever: the page comes in on its own, then the header and
 * footer build around it (main.css, "First visit"), so each gets looked at
 * in turn. The <head> script in nuxt.config.ts marks the visit before the
 * first paint (data-intro); this only keeps time, from --intro-at
 * (utils/intro.ts). `ackzell.intro` in the console plays it again
 * (plugins/console.client.ts).
 */
export default defineNuxtPlugin(() => {
  const root = document.documentElement
  if (root.dataset.intro !== '') return
  try {
    localStorage.setItem(INTRO_SEEN, '1')
  } catch {
    // Storage blocked: the head script never marks the visit then.
  }
  if (document.visibilityState === 'visible') return buildIntro(introLeft())
  // Prerendered (Edge/Chrome from the address bar) or opened in a background
  // tab: CSS keeps time unseen, so the build would be over before anyone
  // looks. Show plainly to nobody, then start it fresh once on screen.
  delete root.dataset.intro
  const shown = () => {
    if (document.visibilityState !== 'visible') return
    document.removeEventListener('visibilitychange', shown)
    root.dataset.intro = ''
    buildIntro(cssTime('--intro-at'))
  }
  document.addEventListener('visibilitychange', shown)
})
