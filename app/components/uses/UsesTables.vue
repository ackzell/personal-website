<script setup lang="ts">
const props = defineProps<{ categories: UsesCategory[] }>()
const { t } = useI18n()

// The frame glyphs of each rule: left, the two inner joints, right.
const rules = {
  top: ['┌', '┬', '┬', '┐'],
  mid: ['├', '┼', '┼', '┤'],
  bottom: ['└', '┴', '┴', '┘'],
} as const

// From the first year to the last, or to now while I still use it.
const years = (tool: UsesTool) => `${tool.since}–${tool.until ?? t('uses.now')}`

// Every table shares its column widths, in characters, so the frames line up
// down the page: the longest tool name anywhere (with its link arrow), and
// the longest range or the label.
const tools = computed(() => props.categories.flatMap((category) => category.tools))
const widths = computed(() => ({
  '--tool': Math.max(t('uses.tool').length, ...tools.value.map((tool) => tool.name.length + (tool.url ? 2 : 0))),
  '--years': Math.max(t('uses.years').length, ...tools.value.map((tool) => years(tool).length)),
}))

// Each table is the answer to a query, as psql prints one: typed after the
// prompt, then the table, then the count. The query stays SQL in either
// language; only the category in its string is translated.
const prompt = 'ackzell=> '
// On two lines, WHERE under SELECT.
const select = 'SELECT * FROM uses\nWHERE category = '
const indent = ' '.repeat(prompt.length)
const query = (category: UsesCategory) => `${select}'${category.name}';`
// Every query types at once and quickly, the longest in TYPING ms (the
// others at the same pace, done sooner), then a breath before enter: all
// the tables print together from then, so nobody waits on a show.
const TYPING = 450
const PAUSE = 120
const longest = computed(() => Math.max(...props.categories.map((category) => query(category).length)))
const timing = computed(() => ({
  '--key': `${TYPING / longest.value}ms`,
  '--pause': `${PAUSE}ms`,
  '--typed': `${TYPING + PAUSE}ms`,
  '--row-step': `${STEP}ms`,
}))
// Highlighted as an editor would: the names (*, the table, the column) a
// shade apart from the keywords, and the string literal as a value.
const names = new Set([...select.matchAll(/\*|uses|category/g)].flatMap((match) => [...match[0]].map((_, i) => match.index + i)))
// The category itself, inside its quotes, is the table's title: lit.
const kind = (index: number, category: UsesCategory) =>
  index > select.length && index <= select.length + category.name.length ? 'query__char--value query__char--title'
    : index >= select.length ? 'query__char--value' : names.has(index) ? 'query__char--name' : undefined

// The order a row draws in, down its table; a rule draws with the row under it.
const at = (step: number) => ({ '--step': step })

// Each table draws itself when it comes into view: the ones on screen when
// the page arrives, the rest as they are scrolled to. Armed only once the
// observer runs, so without script (or with reduced motion) they just stand.
const armed = ref(false)
const drawn = reactive(new Set<string>())
const root = useTemplateRef<HTMLElement>('root')
let observer: IntersectionObserver | undefined

/*
 * Heard in two parts, each one sound for every table drawing together: the
 * typing, a short run of keys as they start, then the tables drawing, held
 * for as long as the longest one's rules take (its top rule and a rule per
 * row), set off by the first top rule to start. Keyframe names carry the
 * scoped suffix.
 */
const STEP = 70
let pending = 0

function heard(event: AnimationEvent) {
  if (event.pseudoElement || !pending || !event.animationName.startsWith('uses-rule')) return
  const rule = event.target as HTMLElement
  if (!rule.parentElement?.classList.contains('box__head') || rule.previousElementSibling) return
  soundTable(pending, STEP / 1000)
  pending = 0
}

onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  // The tables on screen when the page arrives draw unfelt; each one scrolled
  // to draws with a short run under the thumb.
  let arriving = true
  observer = new IntersectionObserver((entries) => {
    let drew = false
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const slug = (entry.target as HTMLElement).dataset.slug!
      drawn.add(slug)
      observer!.unobserve(entry.target)
      drew = true
      const rows = props.categories.find((category) => category.slug === slug)?.tools.length ?? 0
      pending = Math.max(pending, rows + 2)
    }
    if (drew) {
      sound('type')
      if (!arriving) haptic('draw')
    }
    arriving = false
  }, { rootMargin: '0px 0px -10% 0px' })
  root.value?.querySelectorAll<HTMLElement>(':scope > section').forEach((box) => observer!.observe(box))
  armed.value = true
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="root" class="uses" :class="{ 'is-armed': armed }" :style="{ ...widths, ...timing }" data-own-entrance
    @animationstart="heard">
    <section v-for="category in categories" :key="category.slug" :aria-labelledby="`uses-${category.slug}`"
      :class="{ 'is-drawn': drawn.has(category.slug) }" :data-slug="category.slug">
      <!-- The query is typed a character at a time, so it is hidden from assistive tech;
           the category name alone labels the table. -->
      <h2 :id="`uses-${category.slug}`" class="query">
        <span class="sr-only">{{ category.name }}</span>
        <span aria-hidden="true">
          <span class="query__prompt">{{ prompt }}</span>
          <template v-for="(char, index) in query(category)" :key="index">
            <template v-if="char === '\n'">
              <br>
              <span class="query__char query__indent" :style="{ '--c': index }">{{ indent }}</span>
            </template>
            <span v-else class="query__char" :class="kind(index, category)" :style="{ '--c': index }">{{ char }}</span>
          </template>
          <span class="query__caret"> </span>
        </span>
      </h2>
      <!-- A table drawn in type, like a CLI prints one. The frame is aria-hidden glyphs;
           the roles carry the structure for assistive tech. -->
      <div class="box" role="table" :aria-labelledby="`uses-${category.slug}`">
        <div class="box__group box__head" role="rowgroup" data-stick>
          <UsesTablesRule :glyphs="rules.top" />
          <div class="box__row" role="row" text-muted op-60>
            <span class="box__bar box__bar--l" aria-hidden="true" />
            <span class="box__cell box__cell--tool" role="columnheader">{{ $t('uses.tool') }}</span>
            <span class="box__bar box__bar--j1" aria-hidden="true" />
            <span class="box__cell box__cell--years" role="columnheader">{{ $t('uses.years') }}</span>
            <span class="box__bar box__bar--j2" aria-hidden="true" />
            <span class="box__cell box__cell--note" role="columnheader">{{ $t('uses.note') }}</span>
            <span class="box__bar box__bar--r" aria-hidden="true" />
          </div>
          <UsesTablesRule :glyphs="rules.mid" :style="at(1)" />
        </div>
        <div class="box__group" role="rowgroup">
          <template v-for="(tool, index) in category.tools" :key="tool.name">
            <UsesTablesRule v-if="index" :glyphs="rules.mid" :style="at(index + 1)" />
            <div class="box__row" role="row" :style="at(index + 1)" text-muted op-60>
              <span class="box__bar box__bar--l" aria-hidden="true" />
              <span class="box__cell box__cell--tool" role="cell">
                <a v-if="tool.url" :href="tool.url" class="box__link" target="_blank" rel="noopener">{{ tool.name
                  }}<span class="box__arrow" aria-hidden="true"> ↗</span></a>
                <template v-else>{{ tool.name }}</template>
              </span>
              <span class="box__bar box__bar--j1" aria-hidden="true" />
              <span class="box__cell box__cell--years" role="cell">{{ years(tool) }}</span>
              <span class="box__bar box__bar--j2" aria-hidden="true" />
              <span class="box__cell box__cell--note" role="cell">{{ tool.note }}</span>
              <span class="box__bar box__bar--r" aria-hidden="true" />
            </div>
          </template>
          <UsesTablesRule :glyphs="rules.bottom" :style="at(category.tools.length + 1)" />
        </div>
      </div>
      <p class="query__count" :style="at(category.tools.length + 2)">{{ $t('uses.rows', category.tools.length) }}</p>
    </section>
  </div>
</template>

<style scoped>
.uses {
  /* The top of the room under the sticky header, as on Contributions. */
  --stick-top: var(--header-height, 0px);
  display: grid;
  gap: var(--gap-section);
  align-items: start;
}

/* Two tables side by side once each has room for its note. */
@media (width >=64rem) {
  .uses {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--gap-section);
  }
}

.query,
.query__count,
.box {
  font-family: var(--font-code);
  font-weight: var(--code-weight);
  font-variation-settings: 'CASL' 0;
  font-size: 1em;
  letter-spacing: normal;
  text-transform: none;
}

.query {
  margin: 0;
  color: var(--heading);
}

.query__prompt {
  color: var(--muted);
}

.query__char--value {
  color: var(--accent);
}

/* The category, the title of its table, glows as the lit things do across
   the site (--hot, --glow; see main.css): neon on dark and vivid, a faint
   bleed of ink on light's paper. */
.query__char--title {
  color: var(--hot);
  text-shadow: var(--glow);
  mix-blend-mode: var(--glow-blend);
}

.query__char--name {
  color: color-mix(in oklab, var(--accent) 70%, var(--bg));
}

.query__indent {
  white-space: pre;
}

/* A block cursor, as a terminal draws one: it sits on each character just
   before it is typed, then blinks at the end of the line while the answer
   prints. Only while typing; at rest there is none. */
.query__char,
.query__caret {
  position: relative;
}

.query__char::before,
.query__caret::before {
  content: '';
  position: absolute;
  inset: 0;
  inline-size: 1ch;
  background: currentColor;
  visibility: visible;
  opacity: 0;
}

.query__caret {
  display: none;
}

.query__count {
  margin-block: var(--space-2) 0;
  color: var(--muted);
}

.box {
  display: grid;
  grid-template-columns:
    [l] 1ch [tool] calc(var(--tool) * 1ch + 2ch) [j1] 1ch [years] calc(var(--years) * 1ch + 2ch) [j2] 1ch [note] minmax(0, 1fr) [r] 1ch;
  margin-block-start: var(--space-2);
  /* The font own line height, so the bars of one line meet the next. */
  line-height: normal;
  color: var(--muted);
}

.box__group,
.box__row,
.box :deep(.box__rule) {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
}

/* The heading rows stay under the header while their table scrolls, on the
   stage color so rows pass under them. */
.box__head {
  position: sticky;
  inset-block-start: var(--stick-top);
  z-index: 1;
  background: var(--bg);
  transition: background-color 600ms var(--ease-out);
}

.box__bar {
  position: relative;
  align-self: stretch;
  overflow: clip;
}

/* One bar per line, so a wrapped note keeps its frame. Taken out of flow so
   the stack takes the height of the row and does not set it. */
.box__bar::before {
  content: '│\A│\A│\A│\A│\A│\A│\A│\A│\A│\A│\A│\A│\A│\A│\A│\A';
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  white-space: pre;
}

.box__bar--l {
  grid-column: l;
}

.box__bar--j1 {
  grid-column: j1;
}

.box__bar--j2 {
  grid-column: j2;
}

.box__bar--r {
  grid-column: r;
}

.box__cell {
  padding-inline: 1ch;
  min-width: 0;
  overflow-wrap: anywhere;
}

.box__cell--tool {
  grid-column: tool;
  color: var(--fg);
}

.box__cell--years {
  grid-column: years;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.box__cell--note {
  grid-column: note;
}

.box__head .box__cell {
  color: var(--muted);
}

.box__link {
  color: inherit;
  text-decoration-color: var(--line);
  text-underline-offset: 0.2em;
  transition: text-decoration-color 200ms var(--ease-out);
}

.box__link:hover,
.box__link:focus-visible {
  text-decoration-color: currentColor;
}

/* Out to the product. Inline-block keeps the underline off it. */
.box__arrow {
  display: inline-block;
  white-space: pre;
  color: var(--muted);
  transition: color 200ms var(--ease-out), translate 200ms var(--ease-out);
}

.box__link:hover .box__arrow,
.box__link:focus-visible .box__arrow {
  color: var(--accent);
  translate: 0.15ch -0.15ch;
}

/* Phones: two columns, the note under its tool. */
@media (width < 40rem) {
  .uses {
    --stick-top: calc(var(--header-height, 0px) - var(--header-tuck, 0px));
    font-size: 0.9em;
  }

  .box {
    grid-template-columns: [l] 1ch [tool] minmax(0, 1fr) [j1] 1ch [years] calc(var(--years) * 1ch + 2ch) [r] 1ch;
  }

  .box__row {
    grid-template-rows: auto auto;
  }

  .box__bar {
    grid-row: 1 / -1;
  }

  .box__bar--j2,
  .box :deep(.box__rule-j2),
  .box :deep(.box__rule-run--note) {
    display: none;
  }

  .box__cell--note {
    grid-column: tool;
    grid-row: 2;
  }

  /* Its header has no column to sit over: read, not shown. */
  .box__head .box__cell--note {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}

.is-armed .query__char::before {
  color: var(--fg);
  animation: uses-caret var(--key) step-end paused;
  animation-delay: calc((var(--c) - 1) * var(--key));
}

.is-armed .query__caret {
  display: inline;
}

.is-armed .query__caret::before {
  animation: uses-blink 1060ms step-end 3 paused;
  /* Right as the last character lands. */
  animation-delay: calc(var(--typed) - var(--pause));
}

/* Armed, each query waits unwritten; in view, it is typed, and then its
   table draws row by row, the way a terminal prints one: rules left to right,
   bars downward, then the words come into focus. Then the count. */
.is-armed .query__char {
  /* step-start: shown as its turn begins. Waiting on the end left late
     characters hidden, the finish landing a float short of it. */
  animation: uses-type 1ms step-start both paused;
  animation-delay: calc(var(--c) * var(--key));
}

.is-armed .box :deep(.box__rule),
.is-armed .box__bar,
.is-armed .box__cell,
.is-armed .query__count {
  --delay: calc(var(--typed) + var(--step, 0) * var(--row-step));
  animation-duration: 380ms;
  animation-timing-function: var(--ease-out);
  animation-fill-mode: both;
  animation-play-state: paused;
}

.is-armed .box :deep(.box__rule) {
  animation-name: uses-rule;
  animation-delay: var(--delay);
}

.is-armed .box__bar {
  animation-name: uses-bar;
  animation-duration: 240ms;
  animation-delay: calc(var(--delay) + 120ms);
}

.is-armed .box__cell {
  animation-name: uses-text;
  animation-delay: calc(var(--delay) + 180ms);
}

.is-armed .query__count {
  animation-name: uses-text;
  animation-delay: calc(var(--delay) + 120ms);
}

.is-armed .is-drawn .query__char,
.is-armed .is-drawn .query__char::before,
.is-armed .is-drawn .query__caret::before,
.is-armed .is-drawn :deep(.box__rule),
.is-armed .is-drawn .box__bar,
.is-armed .is-drawn .box__cell,
.is-armed .is-drawn .query__count {
  animation-play-state: running;
}

@keyframes uses-caret {

  from,
  to {
    opacity: 0.85;
  }
}

@keyframes uses-blink {
  from {
    opacity: 0.85;
  }

  50% {
    opacity: 0;
  }
}

@keyframes uses-type {
  from {
    visibility: hidden;
  }
}

@keyframes uses-rule {
  from {
    clip-path: inset(0 100% 0 0);
  }

  to {
    clip-path: inset(0);
  }
}

@keyframes uses-bar {
  from {
    clip-path: inset(0 0 100% 0);
  }

  to {
    clip-path: inset(0);
  }
}

@keyframes uses-text {
  from {
    opacity: 0;
    filter: blur(3px);
  }

  to {
    opacity: 1;
    filter: none;
  }
}
</style>
