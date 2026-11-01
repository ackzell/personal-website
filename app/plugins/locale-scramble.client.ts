import { animate, scrambleText } from 'animejs'
import type { FlapRow } from '~/utils/soundSets'
import { localeSwitching } from '~/utils/localeSwitch'

/*
 * On a language switch the page turns over in place, in two beats:
 *
 * 1. Out: everything that won't scramble fades out, still in the old
 *    language. That's the boxes holding long text (paragraphs, too long to
 *    read through a scramble) and anything marked `data-switch-fade` (a
 *    painted copy of text, like the home intro's lines). The switch waits
 *    for it before the new page comes in.
 * 2. In: short text morphs from the old language into the new one, letters
 *    scrambling and settling left to right, top of the screen first, and the
 *    faded boxes come back in, in the new language, on the same wave. Short
 *    text inside a faded box comes back with it rather than scrambling.
 *
 * It's a change in place, not a trip to another page: the page transition
 * is skipped for it, so nothing hands over around text that's still turning.
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
 *
 * The new language never shows early: from the switch until the page has
 * re-rendered, every text Vue rewrites is put back to what it was before the
 * browser paints (hold), and beat 2 starts in the same task the page
 * finishes in.
 *
 * It's heard as a departures board turning over (soundBoard), each node a
 * row of flaps on the scramble's own timing. Under reduced motion nothing
 * scrambles, so the switch is heard as any other setting's.
 */
const ROOTS = '.site-header, main, .site-footer'
const SKIP = '[lang="nah"], script, style, code, pre, .sr-only, [data-no-scramble]'
const FADE = '[data-switch-fade]'
const MAX_LENGTH = 60
// A letter settles every 1/REVEAL_RATE s after the one before, SETTLE ms after it starts scrambling.
const REVEAL_RATE = 40
const SETTLE = 300
// Beat 1's fade out and beat 2's fade back in (ms).
const FADE_OUT = 160
const FADE_IN = 280
const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)'
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as { locale: Ref<string> }
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Each change in progress, as how to cut it short with the new text in place.
  let running: (() => void)[] = []
  // Beat 1's fades, held at nothing until beat 2 takes over.
  let leaving: Animation[] = []
  // Held nodes: the text Vue wrote, while the old one still shows.
  const held = new Map<Text, string>()
  let holding: { observer: MutationObserver, timeout: number } | undefined

  // Until the page re-renders, put back the old text of anything Vue
  // rewrites. MutationObserver runs before paint, so the new text is never
  // seen. Text that arrives new, with no text before it, isn't held.
  function hold() {
    release()
    const holds = (node: Text) => {
      const parent = node.parentElement
      return !!parent?.closest(ROOTS) && !parent.closest(SKIP)
    }
    const put = (node: Text, old: string) => {
      if (node.nodeValue === old || !holds(node)) return
      held.set(node, node.nodeValue!)
      node.nodeValue = old
    }
    const observer = new MutationObserver((records) => {
      const seen = new Set<Node>()
      const swapped = new WeakMap<Node, string>()
      for (const record of records) {
        const { target, oldValue, addedNodes, removedNodes } = record
        if (record.type === 'characterData') {
          // A node's first record in the batch holds what was on screen.
          if (!(target instanceof Text) || oldValue === null || seen.has(target)) continue
          seen.add(target)
          put(target, oldValue)
        }
        // Vue sets an element's only text by swapping in a new node: the new
        // one shows the text of the one it replaced. One node can be swapped
        // more than once in a batch, so each new node carries the first's.
        else if (addedNodes.length === 1 && removedNodes.length === 1) {
          const [added] = addedNodes
          const [removed] = removedNodes
          if (!(added instanceof Text && removed instanceof Text)) continue
          const old = swapped.get(removed) ?? removed.nodeValue!
          swapped.set(added, old)
          if (added.isConnected) put(added, old)
        }
      }
      // Our own writes are records too; drop them.
      observer.takeRecords()
    })
    observer.observe(document.body, { characterData: true, characterDataOldValue: true, childList: true, subtree: true })
    // If the page never finishes, don't leave the old text up for good.
    holding = { observer, timeout: window.setTimeout(giveUp, 3000) }
  }

  // Give every held node the text Vue wrote.
  function release() {
    if (!holding) return
    holding.observer.disconnect()
    clearTimeout(holding.timeout)
    holding = undefined
    for (const [node, text] of held) node.nodeValue = text
    held.clear()
  }

  // The new page never came: show what's there, in full.
  function giveUp() {
    release()
    for (const fade of leaving) fade.cancel()
    leaving = []
    localeSwitching.value = false
  }

  // Cut any change short and give each node its real text back.
  const stop = () => {
    for (const cut of running) cut()
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

  /** Whether an element is on screen. */
  const onScreen = (el: Element) => {
    const rect = el.getBoundingClientRect()
    return rect.bottom >= 0 && rect.top <= window.innerHeight
  }
  const inView = (node: Text) => onScreen(node.parentElement!)

  /** The box a node's text sits in: its nearest ancestor that isn't inline. */
  const blockOf = (node: Text) => {
    let el = node.parentElement!
    while (el.parentElement && !el.matches(ROOTS) && ['inline', 'contents'].includes(getComputedStyle(el).display)) {
      el = el.parentElement
    }
    return el
  }

  /**
   * What fades rather than scrambles, on screen: the boxes holding long
   * text, and anything marked to. Only the outermost, so nothing fades twice.
   */
  function fadeBoxes(nodes: Text[]) {
    const boxes = new Set<HTMLElement>()
    for (const node of nodes) {
      if (node.nodeValue!.trim().length > MAX_LENGTH && inView(node)) boxes.add(blockOf(node))
    }
    for (const root of document.querySelectorAll(ROOTS)) {
      for (const el of root.querySelectorAll<HTMLElement>(FADE)) {
        // A painted copy can be hidden until it's laid out; it fades in then.
        if (onScreen(el) || !el.getClientRects().length) boxes.add(el)
      }
    }
    const all = [...boxes]
    return all.filter((box) => !all.some((other) => other !== box && other.contains(box)))
  }

  // A wave down the screen, at most a quarter second end to end.
  const delayAt = (el: Element) => {
    const top = el.getBoundingClientRect().top
    return Math.min(250, Math.max(0, (top / window.innerHeight) * 250))
  }

  function morph(before: { text: string, seen: boolean }[]) {
    stop()
    // What each held node was showing is its old text, exactly. Then back
    // to the new text: it's read below, and each scramble puts its old text
    // up again. All in one task, so none of it paints.
    const shown = new Map([...held.keys()].map((node) => [node, node.nodeValue!]))
    release()
    const nodes = textNodes()
    const paired = nodes.length === before.length
    const rows: FlapRow[] = []

    // Faded boxes come back in, on the wave, new text and all.
    const boxes = fadeBoxes(nodes)
    for (const box of boxes) {
      const back = box.animate([{ opacity: 0 }, {}], {
        duration: FADE_IN,
        delay: delayAt(box),
        easing: EASE_OUT,
        fill: 'backwards',
      })
      running.push(() => back.cancel())
    }
    // Beat 2 holds them now; beat 1 can let go.
    for (const fade of leaving) fade.cancel()
    leaving = []

    nodes.forEach((node, i) => {
      const text = node.nodeValue!
      const old = shown.get(node) ?? (paired ? before[i]!.text : undefined)
      if (old === text || text.trim().length > MAX_LENGTH) return
      if (old === undefined && before.some((line) => line.text === text)) return
      if (boxes.some((box) => box.contains(node))) return
      // Below the fold it would play unseen. While it scrambles the page still
      // has the old text's layout, so on screen before the switch counts too.
      if (!inView(node) && !(paired && before[i]!.seen)) return

      const rect = node.parentElement!.getBoundingClientRect()
      const delay = delayAt(node.parentElement!)
      rows.push({
        at: delay / 1000,
        chars: Math.max((old ?? text).length, text.length),
        step: 1 / REVEAL_RATE,
        settle: SETTLE / 1000,
        pan: ((rect.left + rect.right) / window.innerWidth) - 1,
      })

      const proxy = document.createElement('span')
      // No old text to start from: noise, never the new words.
      proxy.textContent = old ?? text.replace(/\S/g, () => String.fromCharCode(97 + Math.floor(Math.random() * 26)))
      const animation = animate(proxy, {
        innerHTML: scrambleText({
          text,
          chars: 'lowercase',
          from: 'left',
          // Start from the old words as they were, else from noise.
          override: old === undefined,
          revealRate: REVEAL_RATE,
          settleDuration: SETTLE,
        }),
        delay,
        onUpdate: () => {
          node.nodeValue = proxy.textContent
        },
        onComplete: () => {
          node.nodeValue = text
        },
      })
      // Show the starting text right away, before the delay runs out.
      node.nodeValue = proxy.textContent
      running.push(() => {
        animation.cancel()
        node.nodeValue = text
      })
    })
    localeSwitching.value = false
    if (rows.length) soundBoard(rows)
  }

  // A switch is the same page under another locale's name (about___es).
  const localeOf = (name: unknown) => String(name ?? '').split('___')[1]
  const baseOf = (name: unknown) => String(name ?? '').split('___')[0]
  useRouter().beforeEach(async (to, from) => {
    if (!from.name || localeOf(to.name) === localeOf(from.name) || baseOf(to.name) !== baseOf(from.name)) return
    to.meta.viewTransition = false
    if (reduceMotion()) return
    // Beat 1. The locale has already changed and the page may have
    // re-rendered, but the hold keeps it in the old language.
    stop()
    for (const fade of leaving) fade.cancel()
    leaving = fadeBoxes(textNodes()).map((box) => box.animate([{}, { opacity: 0 }], {
      duration: FADE_OUT,
      easing: EASE_IN_OUT,
      fill: 'forwards',
    }))
    await Promise.all(leaving.map((fade) => fade.finished.catch(() => {})))
  })

  // flush: 'pre' runs before the page re-renders, so this still reads the
  // old language.
  watch(i18n.locale, () => {
    if (reduceMotion()) return sound('toggle')
    // Set before any component re-renders in the new language.
    localeSwitching.value = true
    const before = textNodes().map((node) => ({ text: node.nodeValue!, seen: inView(node) }))
    hold()
    // Not a frame later: the re-rendered page would paint in the new
    // language first.
    nuxtApp.hooks.hookOnce('page:finish', () => morph(before))
  }, { flush: 'pre' })

  // Leaving mid-change: every node gets its text back before Vue patches it.
  nuxtApp.hook('page:start', stop)
})
