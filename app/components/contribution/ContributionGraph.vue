<script setup lang="ts">
import { animate, scrambleText } from 'animejs'
import { animate as spring, useMotionValue, useMotionValueEvent, type Transition } from 'motion-v'

/**
 * Contributions as a commit log, newest on top. The main line is the
 * projects: each one is a commit on it. Each pull request of mine forks off
 * the project's commit to the right, lands as my commit, and merges back
 * into the line. Drawn in type, the way git log --graph draws it.
 *
 * Errata (typos, links added to lists) sit in the same log, muted, and only
 * when the toggle asks for them. A project shows while any of its merges
 * does; a year marks where the next project's newest shown merge falls in a
 * new year, and skipped years run dotted.
 *
 * It's one flat list of rows, each drawing its own piece of the graph from
 * the row's edges, so the drawing follows the text however it wraps.
 *
 * As in the experience timeline, the project being read stays full and the
 * rest step back: the one under the pointer or focus, otherwise the one
 * passing the upper part of the viewport. Rows below the fold arrive the first
 * time they scroll in, one after another.
 *
 * Tapping a project's rows (not its links) brings the project to that reading
 * line, and the log runs on past its end so the last project can reach it.
 *
 * The lit project wears HEAD, as git log decorates the commit checked out,
 * and the tag travels the log to the next one lit.
 */
const props = defineProps<{ projects: ContributedProject[] }>()

const { t, locale } = useI18n()
const reducedMotion = usePreferredReducedMotion()

const showErrata = ref(false)
const errataCount = computed(() => props.projects.reduce((n, p) => n + p.merges.filter((m) => m.erratum).length, 0))

/*
 * Each press runs the command again: the flag decodes into the other one,
 * like the scheme and locale switches, and the log clears and prints its new
 * output line by line. `runs` keys the log so it renders fresh; the first
 * render, before any run, prints nothing.
 */
const flag = (on: boolean) => (on ? '--errata' : '--no-errata')
const shownFlag = ref(flag(showErrata.value))

// The prompt's two answers, spelled out; the one in force capitalized, as a
// shell marks its default.
const answers = computed(() => [
  { value: true, label: t('contributions.yes') },
  { value: false, label: t('contributions.no') },
])
const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

/*
 * On arrival the command types itself in, key by key behind a block cursor,
 * and only then prints its output. It's all CSS from the first paint (each
 * key knows its place, --c, and the line its length, --typed), so the
 * server's HTML types in the same way and nothing flashes before hydration.
 * The first run ends it.
 */
const command = 'git log --graph'
const typed = command.length + 1 + shownFlag.value.length
const booting = ref(true)
const runs = ref(0)
let scrambling: ReturnType<typeof animate> | undefined

/*
 * The arrival is heard as it's seen, off the animations themselves: a key as
 * the cursor reaches it, enter as the cursor leaves the end of the line, and
 * each row of the log as it prints. Not a later run, for now. Keyframe names
 * carry the scoped suffix. Without the motion there's nothing to hear.
 */
function typing(event: AnimationEvent) {
  if (event.animationName.startsWith('key-cursor') && !event.pseudoElement) sound('key')
  else if (event.animationName.startsWith('log-print') && booting.value) sound('print')
}

function entered(event: AnimationEvent) {
  if (event.animationName.startsWith('key-cursor') && event.pseudoElement) sound('enter')
}

function toggleErrata() {
  const from = shownFlag.value
  showErrata.value = !showErrata.value
  booting.value = false
  const to = flag(showErrata.value)
  runs.value++
  // The run prints every row itself; nothing waits to scroll in after it.
  waiting.value = new Set()
  stopArriving?.()
  printedTo.value = reducedMotion.value === 'reduce' ? Infinity : -1
  if (reducedMotion.value === 'reduce') {
    shownFlag.value = to
    return
  }

  scrambling?.cancel()
  const proxy = document.createElement('span')
  proxy.textContent = from
  scrambling = animate(proxy, {
    innerHTML: scrambleText({ text: to, chars: 'lowercase', from: 'left', revealRate: 40, settleDuration: 300 }),
    onUpdate: () => {
      shownFlag.value = proxy.textContent ?? to
    },
    onComplete: () => {
      scrambling = undefined
      shownFlag.value = to
    },
  })
}

type Row =
  | { kind: 'year', key: string, year: number, gap: boolean, repo?: undefined }
  | { kind: 'project', key: string, repo: string, project: ContributedProject, erratum: boolean }
  | { kind: 'merge', key: string, repo: string, merge: Contribution }

const rows = computed(() => {
  const shown = props.projects
    .map((project) => ({ ...project, merges: project.merges.filter((m) => showErrata.value || !m.erratum) }))
    .filter((project) => project.merges.length)
    .sort((a, b) => b.merges[0]!.merged.localeCompare(a.merges[0]!.merged))

  const rows: Row[] = []
  let previous: number | undefined
  for (const project of shown) {
    const year = Number(project.merges[0]!.merged.slice(0, 4))
    if (year !== previous) {
      rows.push({ kind: 'year', key: `year-${year}`, year, gap: previous !== undefined && previous - year > 1 })
      previous = year
    }
    rows.push({ kind: 'project', key: project.repo, repo: project.repo, project, erratum: project.merges.every((m) => m.erratum) })
    for (const merge of project.merges) rows.push({ kind: 'merge', key: merge.id, repo: project.repo, merge })
  }
  return rows
})

const items = useTemplateRef<HTMLElement[]>('items')
// Each run prints a new list, but Vue refills the same rows array in place:
// the list itself is what changes, and what tells the observer to look again.
const log = useTemplateRef<HTMLElement>('log')

const hovered = ref<string>()
const reading = ref<string>()
const lit = computed(() => hovered.value ?? reading.value)

// While a tapped project scrolls to the line, it stays lit instead of every
// project the scroll passes on the way. Released once scrolling settles.
const travelling = ref(false)
const arrive = useDebounceFn(() => {
  travelling.value = false
}, 150)
useEventListener('scroll', () => {
  if (travelling.value) arrive()
}, { passive: true })

// The project whose rows reach a thin line a third of the way down: the last
// one to start above it. Years belong to no project and leave the reading as
// it was. Read from where the rows are rather than from which one crossed: a
// flick to the top carries the first project past the line between two
// looks, and on phones it sits below the line at the top of the page.
useIntersectionObserver(() => log.value && items.value, (records) => {
  if (travelling.value || !items.value) return
  const line = records[0]?.rootBounds?.bottom ?? window.innerHeight * 0.34
  const tops = items.value
    .filter((el) => el.dataset.repo)
    .map((el) => ({ repo: el.dataset.repo, top: el.getBoundingClientRect().top }))
    .sort((a, b) => a.top - b.top)
  const reached = tops.findLast(({ top }) => top <= line) ?? tops[0]
  if (reached) reading.value = reached.repo
}, { rootMargin: '-33% 0px -66% 0px' })

// Each project reaching the line is felt, as the log is scrolled through:
// not the first one read, nor the one a tap sends it to.
watch(reading, (now, was) => {
  if (now && was && !travelling.value) haptic('commit')
})

function go(event: MouseEvent, repo?: string) {
  if (!repo || (event.target as HTMLElement).closest('a, button')) return
  const el = items.value?.find((item) => item.dataset.key === repo)
  if (!el) return
  reading.value = repo
  travelling.value = true
  // Already in place: no scroll comes to release it.
  arrive()
  el.scrollIntoView({ block: 'start', behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth' })
}

// Touch has no hover: a finger enters as it presses and leaves as it lifts,
// which would flash the preview on every tap.
function point(event: PointerEvent, repo?: string) {
  if (event.pointerType !== 'touch') hovered.value = repo
}

// Only keyboard focus lights a project. A tapped link keeps focus too, and
// would hold the light where the tap left it while the log scrolls on.
function focus(event: FocusEvent, repo?: string) {
  if ((event.target as HTMLElement).matches(':focus-visible')) hovered.value = repo
}

function leave(repo?: string) {
  if (hovered.value === repo) hovered.value = undefined
}

/* Rows below the fold at mount wait, and arrive as they scroll in; rows
   coming in together follow one another down (--batch). Rows already on
   screen, and every row without JS, are simply there. */
const waiting = ref(new Set<string>())
const batch = ref<Record<string, number>>({})
let stopArriving: (() => void) | undefined

onMounted(async () => {
  // Measured where the page will be read, not where the last one was left.
  await pageScrolled()
  const below = (items.value ?? []).filter((el) => el.getBoundingClientRect().top > window.innerHeight)
  if (!below.length) return
  waiting.value = new Set(below.map((el) => el.dataset.key!))
  const { stop } = useIntersectionObserver(below, (records) => {
    const arriving = records.filter((record) => record.isIntersecting).map((record) => (record.target as HTMLElement).dataset.key!)
    if (!arriving.length) return
    const next = new Set(waiting.value)
    for (const [order, key] of arriving.entries()) {
      batch.value[key] = order
      next.delete(key)
    }
    waiting.value = next
    if (!next.size) stop()
  }, { rootMargin: '0px 0px -15% 0px' })
  stopArriving = stop
})
onBeforeUnmount(() => stopArriving?.())

/*
 * HEAD sits after the lit project's name, where every project row keeps room
 * for it, and moves to the next on a spring that keeps its speed if the light
 * moves on mid-way. It waits for its row to print (on arrival and on each
 * run) or scroll in, and comes on in place rather than travelling there.
 */
const HEAD: Transition = { type: 'spring', bounce: 0.15, visualDuration: 0.45 }

const frame = useTemplateRef<HTMLElement>('frame')
const headX = useMotionValue(0)
const headY = useMotionValue(0)
useMotionValueEvent(headX, 'change', (now) => frame.value?.style.setProperty('--head-x', `${now}px`))
useMotionValueEvent(headY, 'change', (now) => frame.value?.style.setProperty('--head-y', `${now}px`))

// The last row printed in this run, top down. Without the printing (reduced
// motion), every row is there at once.
const printedTo = ref(-1)
onMounted(() => {
  if (reducedMotion.value === 'reduce') printedTo.value = Infinity
})

function printed(event: AnimationEvent) {
  // Keyframe names carry the scoped suffix.
  if (!event.animationName.startsWith('log-print')) return
  const key = (event.target as HTMLElement).dataset.key
  printedTo.value = Math.max(printedTo.value, rows.value.findIndex((row) => row.key === key))
}

const headRow = computed(() => rows.value.findIndex((row) => row.kind === 'project' && row.repo === lit.value))
const headOn = computed(() => headRow.value >= 0 && headRow.value <= printedTo.value && !waiting.value.has(lit.value!))
let headPlaced = false
// Going from one row to the next, the pointer leaves one before it enters the
// other: HEAD only counts as gone once it has faded out.
const forgetHead = useTimeoutFn(() => {
  headPlaced = false
}, 200, { immediate: false })

function placeHead(jump: boolean) {
  const row = items.value?.find((item) => item.dataset.key === lit.value)
  const slot = row?.querySelector<HTMLElement>('.log__head-slot')
  if (!row || !slot) return
  // Offsets, not boxes: they leave out the rows' own print and arrival moves.
  const x = row.offsetLeft + slot.offsetLeft
  const y = row.offsetTop + slot.offsetTop
  // The slot's size follows the heading it sits in; the tag takes it.
  frame.value?.style.setProperty('--head-size', getComputedStyle(slot).fontSize)
  if (jump || reducedMotion.value === 'reduce') {
    headX.jump(x)
    headY.jump(y)
    return
  }
  spring(headX, x, HEAD)
  spring(headY, y, HEAD)
}

watch([lit, headOn], () => {
  if (!headOn.value) {
    forgetHead.start()
    return
  }
  forgetHead.stop()
  placeHead(!headPlaced)
  headPlaced = true
}, { flush: 'post' })
useResizeObserver(frame, () => headPlaced && placeHead(true))

const monthFormat = computed(() => new Intl.DateTimeFormat(locale.value, { month: 'short', year: 'numeric', timeZone: 'UTC' }))
const formatDate = (date: string) => monthFormat.value.format(new Date(`${date}T00:00:00Z`))

const owner = (repo: string) => repo.split('/')[0]
const name = (repo: string) => repo.split('/')[1]
</script>

<template>
  <div class="contributions" grid gap="block" :data-booting="booting || undefined" :style="{ '--typed': typed }"
    @animationstart="typing" @animationend="entered">
    <!-- The switch as a command of the log itself and the question it asks: the
         answer picks the flag on the git log below it. -->
    <div class="errata-switch" data-stick>
      <SiteMarkLayer clipped />
      <p class="errata-switch__command" m="0" aria-hidden="true">$ <span v-for="(key, c) in command" :key="c"
          class="key" :style="{ '--c': c }">{{ key }}</span> <span class="errata-switch__flag"><span
            v-for="(key, c) in shownFlag" :key="c" class="key" :style="{ '--c': command.length + 1 + c }">{{ key
            }}</span></span></p>
      <p class="errata-switch__prompt" m="0" role="group" :aria-label="t('contributions.prompt', { count: errataCount })">
        <span aria-hidden="true">? {{ t('contributions.prompt', { count: errataCount }) }} [</span>
        <template v-for="(answer, a) in answers" :key="answer.label">
          <span v-if="a > 0" aria-hidden="true">/</span>
          <button type="button" class="errata-switch__answer" :aria-pressed="showErrata === answer.value"
            data-no-scramble @click="answer.value !== showErrata && toggleErrata()">{{ showErrata === answer.value
              ? capitalize(answer.label) : answer.label }}</button>
        </template>
        <span aria-hidden="true">]</span>
      </p>
    </div>

    <div ref="frame" class="log-frame" @animationend="printed">
    <Transition mode="out-in" :css="reducedMotion !== 'reduce'">
      <ol ref="log" :key="runs" class="log" :class="{ 'log--printing': runs > 0 }" m="0" px="0" pt="0" list="none">
        <li v-for="(row, i) in rows" ref="items" :key="row.key" class="log__row"
          :class="[`log__row--${row.kind}`, { 'is-lit': row.repo && lit === row.repo }]"
          :style="{ '--i': i, '--batch': batch[row.key] ?? 0 }" :data-key="row.key" :data-repo="row.repo"
          :data-state="waiting.has(row.key) ? 'pending' : undefined" @pointerenter="point($event, row.repo)"
          @pointerleave="leave(row.repo)" @focusin="focus($event, row.repo)" @focusout="leave(row.repo)"
          @click="go($event, row.repo)"
          :data-erratum="(row.kind === 'merge' && row.merge.erratum) || (row.kind === 'project' && row.erratum) || undefined"
          :data-gap="(row.kind === 'year' && row.gap) || undefined">
          <span class="log__graph" aria-hidden="true">
            <span class="log__line" />
            <span v-if="row.kind === 'merge'" class="log__fork" />
            <span v-if="row.kind === 'merge'" class="log__branch" />
            <span v-if="row.kind === 'merge'" class="log__join" />
            <span v-if="row.kind !== 'year'" class="log__node" />
          </span>

          <span v-if="row.kind === 'year'" typeset="code" text="sm muted" class="tabular-nums">{{ row.year }}</span>

          <h2 v-else-if="row.kind === 'project'" m="0" typeset="code" font="normal" text="base">
            <a :href="row.project.url" target="_blank" rel="noopener" class="log__repo decoration-none">
              <span class="text-muted">{{ owner(row.project.repo) }}/</span>{{ name(row.project.repo) }}
            </a>
            <span class="log__head-slot" typeset="code" text="sm" aria-hidden="true">(HEAD)</span>
          </h2>

          <div v-else class="log__merge" grid gap="1">
            <a decoration-0 :href="row.merge.url" target="_blank" rel="noopener">{{ row.merge.title }}</a>
            <p v-if="row.merge.note" m="0">{{ row.merge.note }}</p>
            <p m="0" typeset="code" text="sm muted" class="tabular-nums">
              #{{ row.merge.number }} · <time :datetime="row.merge.merged">{{ formatDate(row.merge.merged) }}</time>
            </p>
          </div>
        </li>
      </ol>
    </Transition>
      <span class="log__head" :class="{ 'is-on': headOn }" typeset="code" text="sm muted" aria-hidden="true">(<span
          class="log__head-ref">HEAD</span>)</span>
    </div>
  </div>
</template>

<style scoped>
/* The top of the room under the sticky header, as scroll-padding sets it
   (main.css). On phones only the band sticks. */
.contributions {
  --stick-top: var(--header-height, 0px);
}

@media (width < 40rem) {
  .contributions {
    --stick-top: calc(var(--header-height, 0px) - var(--header-tuck, 0px));
    /* The log is dense with code and indents by lanes: a step smaller still,
       and its main line closer to the edge, so the text keeps its width. */
    font-size: 0.9em;
  }

  .log {
    margin-inline-start: calc(var(--gutter) / -2);
  }
}

/* A run-on repo name or title breaks anywhere rather than push the page
   sideways. */
.log__repo,
.log__merge {
  overflow-wrap: anywhere;
}

.log {
  /* One line of the drawing; every glyph sits on this grid. In em, so the
     grid follows the text size (smaller on phones). */
  --lh: 1.65em;

  /* Room past the oldest project, so it can scroll up to the reading line. */
  padding-block-end: 60svh;
}

/* The log prints in the frame; HEAD rides over it, from the top corner to
   its slot (--head-x, --head-y, from the springs). It keeps the stage color
   under it as it crosses the rows, and scrolls under the sticky switch. */
.log-frame {
  position: relative;
}

.log__head-slot,
.log__head {
  line-height: 1.4;
  white-space: nowrap;
}

.log__head-slot {
  display: inline-block;
  margin-inline-start: 1ch;
  visibility: hidden;
}

.log__head {
  position: absolute;
  z-index: 1;
  inset-block-start: 0;
  inset-inline-start: 0;
  translate: var(--head-x, 0) var(--head-y, 0);
  font-size: var(--head-size);
  background: var(--bg);
  pointer-events: none;
  opacity: 0;
  filter: blur(4px);
  transition:
    opacity 200ms var(--ease-out),
    filter 200ms var(--ease-out);
}

/* It comes on as its row arrives, out of the same soft blur, a beat after. */
.log__head.is-on {
  opacity: 1;
  filter: none;
  transition-duration: 500ms;
  transition-delay: 150ms;
}

/* As git colors it. */
.log__head-ref {
  color: var(--accent);
  font-weight: 700;
}

/* A tapped project comes to the reading line, a third of the way down. */
.log__row--project {
  scroll-margin-block-start: calc(33svh - var(--stick-top));
}

.log__row[data-repo] {
  cursor: pointer;
}

/* Rows indent by lane, in characters: projects and years one past the main
   line, my commits one past their branch, as git log --graph sets them. */
.log__row {
  position: relative;
  line-height: var(--lh);
  padding-inline-start: 2ch;
}

/* A merge spends a line forking off and a line joining back. */
.log__row--merge {
  padding-block: var(--lh);
  padding-inline-start: 4ch;
}

.log__row--year {
  padding-block: calc(var(--lh) / 2);
}

.log__row--project h2 {
  line-height: var(--lh);
}

.log__graph {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: 3ch;
  font: 400 1em/var(--lh) var(--font-body);
  white-space: pre;
  overflow: hidden;
  pointer-events: none;
}

/* Each piece is a one-character column, clipped to the row, so the drawing
   follows the text however it wraps. */
.log__graph>span {
  position: absolute;
  inline-size: 1ch;
  overflow: hidden;
}

.log__graph>span::before {
  display: block;
}

.log__line {
  inset-block: 0;
  inset-inline-start: 0;
  color: var(--muted);
}

.log__line::before {
  content: '|\A|\A|\A|\A|\A|\A|\A|\A|\A|\A|\A|\A|\A|\A|\A|\A|\A|\A|\A|\A';
}

/* It fades in above the newest project and out below the oldest: the
   projects were there before me and go on after. */
.log__row:first-child .log__line {
  mask-image: linear-gradient(to bottom, transparent, black var(--lh));
}

.log__row:last-child .log__line {
  mask-image: linear-gradient(to bottom, black, transparent);
}

/* Years with nothing merged in between. */
.log__row--year[data-gap] .log__line::before {
  content: ':\A:\A:\A:\A:\A:\A:\A:\A';
}

.log__fork,
.log__branch,
.log__join {
  color: var(--accent);
}

.log__fork {
  inset-block-start: 0;
  inset-inline-start: 1ch;
}

.log__fork::before {
  content: '\\';
}

.log__branch {
  inset-block: calc(var(--lh) * 2) var(--lh);
  inset-inline-start: 2ch;
}

.log__branch::before {
  content: '|\A|\A|\A|\A|\A|\A|\A|\A|\A|\A|\A|\A';
}

.log__join {
  inset-block-end: 0;
  inset-inline-start: 1ch;
}

.log__join::before {
  content: '/';
}

/* A project's commit sits on the main line, covering its stroke. */
.log__node {
  inset-block-start: 0;
  inset-inline-start: 0;
  background: var(--bg);
  color: var(--fg);
  font-weight: 700;
}

.log__node::before {
  content: '*';
}

/* Mine: on the branch, in the accent. */
.log__row--merge .log__node {
  inset-block-start: var(--lh);
  inset-inline-start: 2ch;
  color: var(--accent);
}

.log__repo {
  color: var(--fg);
}

/* Errata: the same shape, stepped back. */
.log__row[data-erratum] :is(.log__fork, .log__branch, .log__join, .log__node) {
  color: var(--muted);
}

.log__row[data-erratum] .log__node::before {
  content: '·';
}

.log__row--merge[data-erratum] .log__merge> :not(:last-child) {
  font-size: 0.875em;
}

.log__row--merge[data-erratum] .log__merge>a,
.log__row--project[data-erratum] .log__repo {
  color: var(--muted);
}

/* Spotlight, as in the experience timeline, on the project being read and
   its merges. The main line stays whole; what hangs off it steps back. Until
   one is lit (or without JS) all stay full. The node's glyph fades, not its
   backing, so the line stays covered under it. */
.log__row> :not(.log__graph),
.log__graph> :not(.log__line, .log__node),
.log__node::before {
  transition: opacity 300ms var(--ease-out);
}

.log:has(.is-lit) .log__row:not(.is-lit)> :not(.log__graph),
.log:has(.is-lit) .log__row:not(.is-lit) .log__graph> :not(.log__line, .log__node),
.log:has(.is-lit) .log__row:not(.is-lit) .log__node::before {
  opacity: 0.4;
}

/* Arriving: each row rises a little out of a soft blur, a beat after the one
   above it. Leaving the pending state is the only transition, so nothing
   replays. */
.log__row {
  transition:
    opacity 500ms var(--ease-out),
    translate 600ms var(--ease-out),
    filter 500ms var(--ease-out);
  transition-delay: calc(var(--batch, 0) * 60ms);
}

.log__row[data-state='pending'] {
  opacity: 0;
  translate: 0 0.5rem;
  filter: blur(4px);
  transition: none;
}

/* A run clears the old output, then prints the new one a line at a time,
   top down, the way a terminal fills. */
.log.v-leave-active {
  transition: opacity 120ms var(--ease-out);
}

.log.v-leave-to {
  opacity: 0;
}

.log--printing>.log__row {
  animation: log-print 160ms var(--ease-out) both;
  animation-delay: min(calc(var(--i) * 24ms), 1200ms);
}

@keyframes log-print {
  from {
    opacity: 0;
    translate: 0 calc(var(--space-1) * -1);
  }
}

/* Each line lands bright and cools, like phosphor. Shadows in currentColor,
   so every glyph glows in its own color. */
.log--printing>.log__row {
  animation-name: log-print, phosphor;
  animation-duration: 160ms, 900ms;
}

@keyframes phosphor {
  from {
    text-shadow:
      0 0 0.5em color-mix(in oklab, currentColor 70%, transparent),
      0 0 0.12em currentColor;
  }
}

/* Booting: the command types in a key at a time once the page wipe is half
   done, the cursor rests a beat at its end (enter), and the rows on screen
   print the way a run prints them. */
.contributions {
  --key: 32ms;
  --boot: 280ms;
  --booted: calc(var(--boot) + (var(--typed) + 1) * var(--key) + 140ms);
}

/* A key stays blank until the cursor, on its cell, moves past it. */
[data-booting] .key {
  animation:
    key-blank calc(var(--boot) + (var(--c) + 1) * var(--key)) step-end,
    key-cursor var(--key) step-end calc(var(--boot) + var(--c) * var(--key));
}

[data-booting] .errata-switch__flag::after {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline-start: 100%;
  inline-size: 1ch;
  animation: key-cursor calc(var(--key) + 140ms) step-end calc(var(--boot) + var(--typed) * var(--key));
}

[data-booting] .errata-switch__prompt {
  animation: boot-in 300ms var(--ease-out) var(--booted) both;
}

[data-booting] .log:not(.log--printing)>.log__row {
  animation: log-print 160ms var(--ease-out) both, phosphor 900ms var(--ease-out) both;
  animation-delay: calc(var(--booted) + min(var(--i) * 24ms, 1200ms));
}

@keyframes key-blank {

  from,
  to {
    color: transparent;
  }
}

@keyframes key-cursor {

  from,
  to {
    background-color: var(--accent);
  }
}

@keyframes boot-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {

  .log--printing>.log__row,
  [data-booting] .key,
  [data-booting] .errata-switch__flag::after,
  [data-booting] .errata-switch__prompt,
  [data-booting] .log>.log__row {
    animation: none;
  }

  /* Rows still arrive in order, as a fade in place. */
  .log__row[data-state='pending'] {
    translate: none;
    filter: none;
  }

  .log__row {
    transition: opacity 300ms var(--ease-out);
    transition-delay: calc(var(--batch, 0) * 40ms);
  }

  .log__head {
    filter: none;
  }
}

/* Same as the scheme and locale switches: muted code around the value,
   and hover or focus underlines it. */
.errata-switch {
  /* It stays under the header while the log scrolls under it, on the stage
     color so the rows don't show through. */
  position: sticky;
  inset-block-start: var(--stick-top);
  z-index: 2;
  padding-block: var(--space-2);
  background: var(--bg);
  transition: background-color 600ms var(--ease-out);
  justify-self: stretch;
  display: grid;
  gap: var(--space-1);
  font-family: var(--font-code);
  font-weight: var(--code-weight);
  font-variation-settings: 'CASL' 0;
  font-size: 0.875em;
  color: var(--muted);
}

.errata-switch__flag {
  position: relative;
  color: var(--fg);
}

.errata-switch__answer {
  padding: var(--space-1) 0.15em;
  border: 0;
  background: none;
  font: inherit;
  font-variation-settings: inherit;
  color: inherit;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 0.3em;
  transition: text-decoration-color 150ms ease, color 150ms ease;
}

.errata-switch__answer[aria-pressed='true'] {
  color: var(--fg);
  cursor: default;
}

.errata-switch__answer:is(:hover, :focus-visible) {
  color: var(--fg);
  text-decoration-color: currentColor;
}

.errata-switch__answer[aria-pressed='true']:hover {
  text-decoration-color: transparent;
}
</style>
