<script setup lang="ts">
import { layout, layoutNextLine, prepareWithSegments } from '@chenglou/pretext'
import type { LayoutCursor, PreparedTextWithSegments } from '@chenglou/pretext'
import { localeSwitching } from '~/utils/localeSwitch'

/*
 * The landing intro: the whole ax mark, set apart above the name and the
 * intro paragraph.
 *
 * The mark is sticky inside this block, held just under the header. As the
 * page scrolls, the name and the paragraph rise into it and part around the
 * ring, a piece of each line on either side, then close again above it. Once
 * the text has passed, the block ends and everything scrolls away together.
 * Lines are laid out by Pretext one at a time; a side too narrow to read is
 * left empty, so on a phone the text parts above and below the ring instead.
 *
 * Without JS, and under reduced motion, it's the plain stack: mark, space,
 * name, paragraph. The real heading and paragraph always stay in the
 * document; the laid-out lines are a visual copy.
 */
const props = defineProps<{ title: string, text: string }>()

const root = useTemplateRef<HTMLElement>('root')
const mark = useTemplateRef<HTMLElement>('mark')
const heading = useTemplateRef<HTMLElement>('heading')
const body = useTemplateRef<HTMLElement>('body')
const lines = useTemplateRef<HTMLElement>('lines')

type Block = {
  prepared: PreparedTextWithSegments
  lineHeight: number
  /** Space above the block, from its element's own margin. */
  before: number
  /** Typography copied onto each painted line. */
  style: Partial<CSSStyleDeclaration>
  /** Painted in the heading color rather than the body's. */
  heading: boolean
}

const flowing = ref(false)
const height = ref<number>()

let blocks: Block[] = []
let fontSize = 16
let gap = 0
let lead = 0
let pool: HTMLSpanElement[] = []
let lastTop = Number.NaN
let lastWidth = Number.NaN
let pending = 0
let parted = false
let lastParting = Number.NEGATIVE_INFINITY
const PARTING_GAP = 300

type Placed = {
  block: Block
  text: string
  width: number
  /** Start-aligned position; pieces beside the ring always use it. */
  x: number
  y: number
  split: boolean
}

/* Measure each element's own font, so the canvas measurements match what
   the browser paints. Rerun when the text or the type scale changes. */
function prepareBlock(el: HTMLElement, text: string, heading = false): Block {
  const cs = getComputedStyle(el)
  const size = parseFloat(cs.fontSize)
  return {
    prepared: prepareWithSegments(text, `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, {
      letterSpacing: parseFloat(cs.letterSpacing) || 0,
    }),
    lineHeight: parseFloat(cs.lineHeight) || size * 1.5,
    before: parseFloat(cs.marginBlockStart) || 0,
    style: {
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontStyle: cs.fontStyle,
      fontWeight: cs.fontWeight,
      fontVariationSettings: cs.fontVariationSettings,
      letterSpacing: cs.letterSpacing,
    },
    heading,
  }
}

function prepareText() {
  blocks = [prepareBlock(heading.value!, props.title, true), prepareBlock(body.value!, props.text)]
  const cs = getComputedStyle(body.value!)
  fontSize = parseFloat(cs.fontSize)
  const markStyle = getComputedStyle(mark.value!)
  gap = parseFloat(markStyle.columnGap) || fontSize
  lead = parseFloat(getComputedStyle(root.value!).rowGap) || 0
}

/* The text starts where it sits in the plain stack, a lead below the mark.
   The mark holds until the text has risen through it and a lead past it,
   mirroring the start, then the block ends and the mark leaves with the
   page; nothing is kept below it, so the next section follows at the usual
   gap. The height never shifts while scrolling. */
function measure() {
  const box = root.value
  const m = mark.value
  if (!blocks.length || !box || !m) return
  const width = box.clientWidth
  const text = blocks.reduce((sum, block) => sum + block.before + layout(block.prepared, width, block.lineHeight).height, 0)
  height.value = Math.ceil(m.offsetHeight * 2 + lead * 2 + text)
  flow(true)
}

/* Half the ring's width across the band [y, y + lh), plus the gap; null where
   the band clears the ring. */
function halfChord(y: number, lh: number, top: number, r: number) {
  const cy = top + r
  const dy = cy < y ? y - cy : cy > y + lh ? cy - (y + lh) : 0
  return dy >= r ? null : Math.sqrt(r * r - dy * dy) + gap
}

function flow(force = false) {
  const box = root.value
  const m = mark.value
  const layer = lines.value
  if (!blocks.length || !box || !m || !layer) return

  const top = m.getBoundingClientRect().top - box.getBoundingClientRect().top
  const width = box.clientWidth
  if (!force && top === lastTop && width === lastWidth) return
  lastTop = top
  lastWidth = width

  const r = m.offsetWidth / 2
  const cx = m.offsetLeft + r
  // About 12 characters: narrower and a side holds stray words, not lines.
  const minSide = fontSize * 7
  let y = m.offsetHeight + lead
  const placed: Placed[] = []
  for (const [index, block] of blocks.entries()) {
    if (index > 0) y += block.before
    let cursor: LayoutCursor | undefined
    let done = false
    while (!done) {
      let any = false
      const h = halfChord(y, block.lineHeight, top, r)
      const pieces: [number, number][] = h === null ? [[0, width]] : [[0, cx - h], [cx + h, width]]
      for (const [from, to] of pieces) {
        if (to - from < minSide) continue
        const line = layoutNextLine(block.prepared, to - from, cursor)
        if (!line) {
          done = true
          break
        }
        // A word wider than this side would be cut in two; leave the side
        // empty and let the word find room further down.
        if (h !== null && line.end.graphemeIndex > 0) continue
        // A left piece hugs the ring: set against it, ragged on the outside.
        const x = h !== null && from === 0 ? to - line.width : from
        placed.push({ block, text: line.text, width: line.width, x, y, split: h !== null })
        cursor = line.end
        any = true
      }
      if (any || !done) y += block.lineHeight
    }
  }

  // While the ring parts the text, whole lines center on its axis so the
  // column reads as split down the middle; otherwise they sit at the start.
  // Each line only knows how far it would move; the layer eases one shared
  // amount (--centered), so flipping back and forth mid-move reverses
  // smoothly and lines rewrapping on scroll never fly across.
  const split = placed.some(p => p.split)
  // Heard as the text parts, when scrolling does it (a relayout or the
  // first lay-out stays quiet; closing again is too); a scroll that flips
  // it back and forth on the edge is heard once.
  if (split !== parted) {
    parted = split
    const now = performance.now()
    if (split && !force && now - lastParting > PARTING_GAP) sound('part')
    lastParting = now
  }
  layer.classList.toggle('is-centered', split)

  for (const [i, p] of placed.entries()) {
    // Each line sits in a holder of no height that takes its place, so a
    // page arrival or a swipe, which move blocks on their own transform and
    // translate, take up the line inside it instead (utils/pageArrival).
    let span = pool[i]
    if (!span) {
      span = document.createElement('span')
      span.append(document.createElement('span'))
      layer.append(span)
      pool[i] = span
    }
    const line = span.firstElementChild!
    if (line.textContent !== p.text) line.textContent = p.text
    Object.assign(span.style, p.block.style)
    span.toggleAttribute('data-heading', p.block.heading)
    span.style.lineHeight = `${p.block.lineHeight}px`
    span.style.setProperty('--x', `${p.x}px`)
    span.style.setProperty('--dx', p.split ? '0px' : `${cx - p.width / 2 - p.x}px`)
    span.style.transform = `translateY(${p.y}px)`
  }
  for (const extra of pool.splice(placed.length)) extra.remove()
}

function schedule() {
  if (pending || !flowing.value) return
  pending = requestAnimationFrame(() => {
    pending = 0
    flow()
  })
}

function relayout() {
  if (!flowing.value || localeSwitching.value) return
  prepareText()
  measure()
}

const { live } = useMarkEntrance(mark)

useEventListener(window, 'scroll', schedule, { passive: true })
useResizeObserver(root, relayout)
// A language switch fades the painted lines out still in the old language
// (plugins/locale-scramble.client.ts): relayout holds off until it's over.
watch(() => [props.title, props.text, localeSwitching.value], relayout)

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  await document.fonts.ready
  if (!body.value) return
  flowing.value = true
  await nextTick()
  relayout()
})

onBeforeUnmount(() => cancelAnimationFrame(pending))
</script>

<template>
  <div ref="root" class="home-intro" :class="{ 'is-flowing': flowing }"
    :style="flowing && height ? { blockSize: `${height}px` } : undefined">
    <div ref="mark" class="home-intro__mark" aria-hidden="true">
      <SiteMarkGlyph class="home-intro__glyph" :class="{ 'is-live': live }" drawn />
    </div>
    <h1 ref="heading" :class="{ 'sr-only': flowing }">{{ title }}</h1>
    <p ref="body" :class="{ 'sr-only': flowing }">{{ text }}</p>
    <div v-show="flowing" ref="lines" class="home-intro__lines" aria-hidden="true" data-no-scramble data-switch-fade />
  </div>
</template>

<style scoped>
.home-intro {
  position: relative;
  /* Space between the mark and the name. Read by the script too; a margin on
     the sticky mark would also hold that space below it at the end. */
  row-gap: 10rem;
}

.home-intro__mark {
  /* Small enough on a phone to leave a readable column on each side. */
  inline-size: clamp(5rem, 25vw, 14rem);
  block-size: clamp(5rem, 25vw, 14rem);
  margin-inline: auto;
  /* Holds the tiles' canvas (utils/markTiles) before it turns sticky. */
  position: relative;
  /* Read by the script as the room kept between the ring and the text. */
  column-gap: clamp(var(--gap-tight), 2vw, var(--gap-group));
}

.home-intro__glyph {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  overflow: visible;
}

/* The plain stack (no JS, reduced motion). */
.home-intro:not(.is-flowing)>h1 {
  margin-block-start: 10rem;
}

.home-intro>p {
  margin-block-start: var(--gap-group);
}

/* Small enough on a phone for each half of the name to fit beside the ring,
   so the name can read "Axel ◯ Martinez" as it rises through it. */
@media (width < 40rem) {
  .home-intro>h1 {
    font-size: 1.375rem;
  }
}

/* Laid out by script: the mark holds just under the header, and under the
   section row where it shows (SiteSectionIndex). */
.is-flowing .home-intro__mark {
  position: sticky;
  inset-block-start: calc(var(--header-height, 0px) + var(--section-index-height, 0px) + var(--gap-block));
}

.home-intro__lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.home-intro__lines > :deep(span) {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  block-size: 0;
  white-space: pre;
  translate: calc(var(--x, 0px) + var(--centered) * var(--dx, 0px)) 0;
}

.home-intro__lines > :deep([data-heading]) {
  color: var(--heading);
}

.home-intro__lines > :deep(span > span) {
  display: block;
  pointer-events: auto;
}

/* Registered so it can transition: 0 at the start, 1 centered. */
@property --centered {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}

.home-intro__lines {
  transition: --centered 600ms var(--ease-in-out);
}

.home-intro__lines.is-centered {
  --centered: 1;
}

/* The A rocks on its feet. */
.home-intro__glyph :deep(.glyph-a) {
  transform-box: fill-box;
  transform-origin: 50% 100%;
}

/* Until the entrance starts (the script draws it), the mark stays hidden;
   if the script never comes, it shows anyway after a moment. Not under
   reduced motion, where the mark is simply there. */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  .home-intro__glyph:not(.is-live) {
    animation: home-mark-wait 2.5s;
  }
}

@keyframes home-mark-wait {

  from,
  to {
    visibility: hidden;
  }
}
</style>
