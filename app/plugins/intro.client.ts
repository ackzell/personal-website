/*
 * A first visit ever: the page comes in on its own, then the header and
 * footer build around it (main.css, "First visit"), so each gets looked at
 * in turn. The <head> script in nuxt.config.ts marks the visit before the
 * first paint (data-intro); this only keeps time, from --intro-at
 * (utils/intro.ts). `ackzell.intro` in the console plays it again
 * (plugins/console.client.ts).
 */
export default defineNuxtPlugin(() => {
  if (document.documentElement.dataset.intro !== '') return
  try {
    localStorage.setItem(INTRO_SEEN, '1')
  } catch {
    // Storage blocked: the head script never marks the visit then.
  }
  buildIntro(introLeft())
})
