import { sound, soundLabels } from './sounds'
import { cssTime } from './cssTime'

/** Set once a browser has seen the first-visit intro (plugins/intro.client.ts). */
export const INTRO_SEEN = 'intro-seen'

// The last of the build to settle (the scheme switch's light), in main.css.
const BUILD = 6500

/**
 * On a first visit, ms until the header and footer start building (main.css,
 * "First visit"), on the page load's clock; 0 once built or on any other visit.
 */
export function introLeft() {
  const root = document.documentElement
  if (root.dataset.intro !== '') return 0
  return Math.max(0, cssTime('--intro-at') - performance.now())
}

// Where an element sits across the screen, -1 (left) to 1 (right), kept off the edges.
function panOf(el: Element) {
  const { left, width } = el.getBoundingClientRect()
  return ((left + width / 2) / innerWidth * 2 - 1) * 0.7
}

/*
 * Each piece heard as it lands, the way the submenu labels are: the brand,
 * each field of the band and the footer's stops tick into place, and the
 * switches ping as they light up. The socials play their own notes
 * (SiteFooter.vue). Silent unless sound is on and the page may play it
 * (sounds.ts), so a real first visit, which has neither, builds quietly.
 */
function landed({ animationName, target }: AnimationEvent) {
  if (!(target instanceof Element)) return
  if (animationName === 'intro-drop' || animationName === 'intro-draw' || target.matches('.site-footer__stops')) {
    soundLabels([{ at: 0, pan: panOf(target), step: 0 }])
  }
}
function lit({ animationName }: AnimationEvent) {
  if (animationName === 'intro-lit') sound('peek')
}

/**
 * Hides the header and footer, then builds them in after `wait` ms ("build")
 * and keeps "done" once built, so nothing replays its everyday entrance after
 * the build's own. Any press, key or scroll shows everything at once.
 */
export function buildIntro(wait: number) {
  const root = document.documentElement
  root.dataset.intro = ''
  const stop = new AbortController()
  let timer = setTimeout(() => {
    root.dataset.intro = 'build'
    timer = setTimeout(end, BUILD)
  }, wait)
  function end() {
    stop.abort()
    clearTimeout(timer)
    root.dataset.intro = 'done'
  }
  for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
    addEventListener(type, end, { signal: stop.signal, passive: true, capture: true })
  }
  addEventListener('animationend', landed, { signal: stop.signal })
  addEventListener('animationstart', lit, { signal: stop.signal })
}
