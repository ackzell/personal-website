import { animate, scrambleText } from 'animejs'
import type { JSAnimation } from 'animejs'

/*
 * On a language switch, short text in the page morphs from the old language
 * into the new one: letters scramble and settle left to right, top of the
 * screen first. Only text that actually changed moves; long text (paragraphs)
 * just swaps, so reading isn't held up.
 *
 * Old and new text are paired by order: a switch re-renders the same page in
 * the other language, so the text nodes line up. If they don't (the page's
 * shape changed), changed text decodes from noise instead.
 *
 * Only on a switch, never on ordinary navigation or first load, and never
 * under reduced motion. Nahuatl words (lang="nah") and screen-reader-only
 * text are left alone.
 *
 * Vue owns these text nodes, so they're never replaced: each scramble runs on
 * an offscreen element and only its text is copied into the node's value.
 * The last frame is the text Vue rendered, so nothing drifts from the app.
 */
const ROOTS = '.site-header, main, .site-footer'
const SKIP = '[lang="nah"], script, style, code, pre, .sr-only, [data-no-scramble]'
const MAX_LENGTH = 60

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as { locale: Ref<string> }
  let running: { animation: JSAnimation, node: Text, text: string }[] = []

  // Cut any scramble short and give each node its real text back.
  const stop = () => {
    for (const { animation, node, text } of running) {
      animation.cancel()
      node.nodeValue = text
    }
    running = []
  }

  /** Visible, non-empty text nodes in page order, whatever their length. */
  function textNodes() {
    const nodes: Text[] = []
    for (const root of document.querySelectorAll(ROOTS)) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT
          const parent = node.parentElement
          if (!parent || parent.closest(SKIP)) return NodeFilter.FILTER_REJECT
          if (!parent.getClientRects().length) return NodeFilter.FILTER_REJECT
          return NodeFilter.FILTER_ACCEPT
        },
      })
      while (walker.nextNode()) nodes.push(walker.currentNode as Text)
    }
    return nodes
  }

  function morph(before: string[]) {
    stop()
    const nodes = textNodes()
    const paired = nodes.length === before.length

    nodes.forEach((node, i) => {
      const text = node.nodeValue!
      const old = paired ? before[i]! : undefined
      if (old === text || text.trim().length > MAX_LENGTH) return
      if (!paired && before.includes(text)) return

      const rect = node.parentElement!.getBoundingClientRect()
      // Below the fold it would play unseen.
      if (rect.bottom < 0 || rect.top > window.innerHeight) return

      const proxy = document.createElement('span')
      proxy.textContent = old ?? text
      const animation = animate(proxy, {
        innerHTML: scrambleText({
          text,
          chars: 'lowercase',
          from: 'left',
          // Paired: start from the old words as they were. Unpaired: noise.
          override: paired ? false : true,
          revealRate: 40,
          settleDuration: 300,
        }),
        // A wave down the screen, at most a quarter second end to end.
        delay: Math.min(250, Math.max(0, (rect.top / window.innerHeight) * 250)),
        onUpdate: () => {
          node.nodeValue = proxy.textContent
        },
        onComplete: () => {
          node.nodeValue = text
        },
      })
      // Show the starting text right away, before the delay runs out.
      node.nodeValue = proxy.textContent
      running.push({ animation, node, text })
    })
  }

  // flush: 'pre' runs before the page re-renders, so this still reads the
  // old language.
  watch(i18n.locale, () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    stop()
    const before = textNodes().map((node) => node.nodeValue!)
    nuxtApp.hooks.hookOnce('page:finish', () => {
      requestAnimationFrame(() => morph(before))
    })
  }, { flush: 'pre' })

  // Leaving mid-scramble: every node gets its text back before Vue patches it.
  nuxtApp.hook('page:start', stop)
})
