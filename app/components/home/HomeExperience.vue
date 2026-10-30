<script setup lang="ts">
import { animate, useMotionValue, useMotionValueEvent, type AnimationPlaybackControls, type Transition } from 'motion-v'

/**
 * Experience as a band of fields, like the flag band in the header but
 * standing up: one field per role, newest on top, each as tall as the time
 * spent there. The heading sticks under the header, and the band sticks under
 * the heading, beside the roles as they scroll by.
 *
 * The field of the role being read lights up: the one holding focus,
 * otherwise the one passing the upper part of the viewport. The other roles
 * step back, as lexicon entries do, so the lit role reads alone. One light
 * travels the band from field to field; every field keeps its share of the
 * career. Pointing at a role only previews it, so the light stays with the
 * role being read: its field brightens, and if it had stepped back it comes
 * part of the way forward.
 *
 * Roles and fields are both links to the role: following one brings the role
 * to the top, under the heading. The band can also be scrubbed: run a finger
 * (or drag the pointer) along it and the page reads the career at that pace.
 *
 * Awards and certifications are footnotes to the role held when they were
 * earned, each marked with a small square, and the same square, smaller, marks
 * its month beside the role's field. They light with their role.
 *
 * The band draws itself in once, top to bottom, the first time it scrolls
 * into view. Server-rendered fields are already full, so without JS (or when
 * the band is already on screen) nothing waits on the animation.
 */
const props = defineProps<{ title: string, roles: Role[], recognition: Recognition[] }>()

const monthIndex = (month: string) => {
  const [year, m] = month.split('-').map(Number)
  return year! * 12 + m!
}

const monthAt = (index: number) => {
  const year = Math.floor((index - 1) / 12)
  return `${year}-${String(index - year * 12).padStart(2, '0')}`
}

// Each role's awards and certifications, oldest first, with where each one
// falls down the role's field (0 at its end, the field's top, to 1 at its start).
const earned = computed(() => {
  const byRole: Record<string, { item: Recognition, at: number }[]> = {}
  for (const item of [...props.recognition].sort((a, b) => a.start.localeCompare(b.start))) {
    const role = props.roles.find((role) => role.start <= item.start && item.start <= role.end)
    if (!role) continue
    const at = (monthIndex(role.end) - monthIndex(item.start) + 0.5) / role.months
      ; (byRole[role.slug] ??= []).push({ item, at })
  }
  return byRole
})

const heading = useTemplateRef<HTMLElement>('heading')
const band = useTemplateRef<HTMLElement>('band')
const entries = useTemplateRef<HTMLElement[]>('entries')

const hovered = ref<string>()
const reading = ref<string>()
const focused = ref<string>()
const scrubbed = ref<string>()
const lit = computed(() => focused.value ?? scrubbed.value ?? reading.value)
// pending: hidden, waiting to scroll in. drawn: fields grown to full.
const state = ref<'drawn' | 'pending'>('drawn')

const { height: headingHeight } = useElementSize(heading, undefined, { box: 'border-box' })

const lastYear = computed(() => props.roles[0]?.end.slice(0, 4))
const firstYear = computed(() => props.roles.at(-1)?.start.slice(0, 4))

const formatMonth = useMonthFormat()

// While a followed link scrolls to its role, the target stays lit instead of
// every role the scroll passes on the way. Released once scrolling settles
// (debounced scroll, since scrollend isn't everywhere yet).
const travelling = ref(false)
const arrive = useDebounceFn(() => {
  travelling.value = false
}, 150)
useEventListener('scroll', () => {
  if (travelling.value) arrive()
}, { passive: true })

// The role crossing a thin line a third of the way down the viewport.
useIntersectionObserver(entries, (records) => {
  if (travelling.value) return
  for (const record of records) {
    if (record.isIntersecting) reading.value = (record.target as HTMLElement).dataset.slug
  }
}, { rootMargin: '-33% 0px -66% 0px' })

// Observers started after the page scrolls (pageScrolled), past setup.
const stops: (() => void)[] = []
onBeforeUnmount(() => stops.forEach((stop) => stop()))

onMounted(async () => {
  await pageScrolled()
  const el = band.value
  if (!el) return
  if (el.getBoundingClientRect().top < window.innerHeight) return
  state.value = 'pending'
  const { stop } = useIntersectionObserver(el, ([record]) => {
    if (!record?.isIntersecting) return
    state.value = 'drawn'
    stop()
  }, { threshold: 0.25 })
  stops.push(stop)
})

/* Each role arrives on its own the first time it scrolls in, piece by piece:
   dates, role, summary, stack. Roles that come in together follow one another
   down the list, as the band's fields do. Roles already on screen at mount
   (and every role without JS) are simply there. */
const waiting = ref(new Set<string>())
const batch = ref<Record<string, number>>({})

onMounted(async () => {
  // Measured where the page will be read, not where the last one was left.
  await pageScrolled()
  const below = (entries.value ?? []).filter((el) => el.getBoundingClientRect().top > window.innerHeight)
  if (!below.length) return
  waiting.value = new Set(below.map((el) => el.dataset.slug!))
  const { stop } = useIntersectionObserver(below, (records) => {
    const arriving = records.filter((record) => record.isIntersecting).map((record) => (record.target as HTMLElement).dataset.slug!)
    if (!arriving.length) return
    const next = new Set(waiting.value)
    for (const [order, slug] of arriving.entries()) {
      batch.value[slug] = order
      next.delete(slug)
    }
    waiting.value = next
    if (!next.size) stop()
  }, { rootMargin: '0px 0px -30% 0px' })
  stops.push(stop)
})

const reducedMotion = usePreferredReducedMotion()
const spring = (transition: Transition) => reducedMotion.value === 'reduce' ? { duration: 0 } : transition

/*
 * The light rides between two edges, each on its own spring. The edge heading
 * the move leads and the other trails, so the light stretches over the fields
 * it passes and gathers onto the one it lands on. Both keep their speed when
 * the reading changes mid-run, so a quick scroll turns the light around
 * rather than restarting it. It first comes on filling its field from the top.
 */
const LEAD: Transition = { type: 'spring', bounce: 0, visualDuration: 0.35 }
const TRAIL: Transition = { type: 'spring', bounce: 0.15, visualDuration: 0.6 }

const light = useTemplateRef<HTMLElement>('light')
const lightOn = ref(false)
const lightTop = useMotionValue(0)
const lightBottom = useMotionValue(0)
useMotionValueEvent(lightTop, 'change', (now) => light.value?.style.setProperty('--top', `${now}px`))
useMotionValueEvent(lightBottom, 'change', (now) => light.value?.style.setProperty('--bottom', `${now}px`))

function placeLight(jump = false) {
  const field = band.value?.querySelector<HTMLElement>(`[data-slug="${lit.value}"]`)
  if (!field) return
  const top = field.offsetTop
  const bottom = top + field.offsetHeight
  if (jump) {
    lightTop.jump(top)
    lightBottom.jump(bottom)
    return
  }
  if (!lightOn.value) {
    lightTop.jump(top)
    lightBottom.jump(top)
    lightOn.value = true
  }
  const down = top >= lightTop.get()
  animate(lightTop, top, spring(down ? TRAIL : LEAD))
  animate(lightBottom, bottom, spring(down ? LEAD : TRAIL))
}

watch(lit, () => placeLight())
// The band takes what height the viewport leaves it: the light follows at once.
useResizeObserver(band, () => lightOn.value && placeLight(true))

/* Bring a role to the top, just under the sticky heading (its scroll margin),
   and keep the hash so the role can be linked to. */
function go(event: MouseEvent, slug: string) {
  if (bring(slug)) event.preventDefault()
}

function bring(slug: string) {
  const el = document.getElementById(`role-${slug}`)
  if (!el) return false
  reading.value = slug
  travelling.value = true
  // Already in place: no scroll comes to release it.
  arrive()
  el.scrollIntoView({ block: 'start', behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth' })
  history.replaceState(history.state, '', `#role-${slug}`)
  return true
}

/*
 * Scrubbing the band. Past a small slop the band takes the pointer, and the
 * page follows on a quick spring: the finger's place within a field puts the
 * same share of that role on the reading line. The light steps with the
 * finger from field to field, with a tick on phones that can. A readout beside
 * the finger names the month, and what was earned there when it passes a
 * square. Let go, the role under the finger comes to the top, as a tap on its
 * field would. Anything shorter than the slop is still a tap.
 */
const SCRUB: Transition = { type: 'spring', bounce: 0, visualDuration: 0.25 }
const SLOP = 6
// How near a square the finger has to pass to read it.
const CATCH = 10

const readout = ref<{ y: number, month: string, item?: Recognition }>()
const pageY = useMotionValue(0)
useMotionValueEvent(pageY, 'change', (now) => window.scrollTo({ top: now, behavior: 'instant' }))

let scrub: { id: number, from: number, active: boolean, top: number } | undefined
let paging: AnimationPlaybackControls | undefined
let swallowClick = false

function scrubStart(event: PointerEvent) {
  // A drag on touch often ends without any click to swallow: the flag mustn't
  // outlive it and eat this press's tap.
  swallowClick = false
  if (event.button !== 0) return
  scrub = { id: event.pointerId, from: event.clientY, active: false, top: 0 }
}

function scrubMove(event: PointerEvent) {
  const el = band.value
  if (!el || event.pointerId !== scrub?.id) return
  if (!scrub.active) {
    if (Math.abs(event.clientY - scrub.from) < SLOP) return
    scrub.active = true
    el.setPointerCapture(event.pointerId)
    pageY.jump(window.scrollY)
    // Read from where the band stood when the scrub began: near the end the
    // section runs out and the rail scrolls on, which mustn't feed back.
    scrub.top = el.getBoundingClientRect().top
    // The page passes every role on the way: none waits to arrive.
    waiting.value = new Set()
  }

  const y = Math.min(Math.max(event.clientY - scrub.top, 0), el.offsetHeight)
  const fields = [...el.querySelectorAll<HTMLElement>('.experience__field')]
  const field = fields.find((field) => y <= field.offsetTop + field.offsetHeight) ?? fields.at(-1)
  const role = props.roles.find((role) => role.slug === field?.dataset.slug)
  const entry = role && document.getElementById(`role-${role.slug}`)
  if (!field || !role || !entry) return
  const share = Math.min(Math.max((y - field.offsetTop) / field.offsetHeight, 0), 1)

  if (scrubbed.value !== role.slug) {
    if (scrubbed.value) navigator.vibrate?.(4)
    scrubbed.value = role.slug
  }

  const near = earned.value[role.slug]
    ?.map(({ item, at }) => ({ item, off: Math.abs(field.offsetTop + at * field.offsetHeight - y) }))
    .filter(({ off }) => off <= CATCH)
    .sort((a, b) => a.off - b.off)[0]
  readout.value = {
    y,
    month: near?.item.start ?? monthAt(Math.round(monthIndex(role.end) - share * (role.months - 1))),
    item: near?.item,
  }

  const to = entry.getBoundingClientRect().top + window.scrollY + share * entry.offsetHeight - window.innerHeight / 3
  if (reducedMotion.value === 'reduce') pageY.jump(to)
  else paging = animate(pageY, to, SCRUB)
}

function scrubEnd(event: PointerEvent) {
  if (event.pointerId !== scrub?.id) return
  const active = scrub.active
  scrub = undefined
  if (!active) return
  swallowClick = true
  paging?.stop()
  readout.value = undefined
  const slug = scrubbed.value
  scrubbed.value = undefined
  if (slug && event.type === 'pointerup') bring(slug)
}

// The click that ends a scrub isn't a tap on whatever it ended over.
function scrubClick(event: MouseEvent) {
  if (!swallowClick) return
  swallowClick = false
  event.preventDefault()
  event.stopPropagation()
}

// Touch has no hover: a finger enters as it presses and leaves as it lifts,
// which would flash the preview on every tap.
function point(event: PointerEvent, slug: string) {
  if (event.pointerType !== 'touch') hovered.value = slug
}

function leave(slug: string) {
  if (hovered.value === slug) hovered.value = undefined
}

// Only keyboard focus holds the light. A tapped link keeps focus too, and
// would hold it where the tap left it while the page scrolls on.
function focus(event: FocusEvent, slug: string) {
  if ((event.target as HTMLElement).matches(':focus-visible')) focused.value = slug
}

function blur(slug: string) {
  if (focused.value === slug) focused.value = undefined
}
</script>

<template>
  <div class="experience" :style="{ '--heading-height': `${headingHeight}px` }">
    <h2 id="timeline-heading" ref="heading" class="experience__heading running-head" m="0" py="group" bg="bg">
      <SiteMarkLayer clipped />{{ title }}
    </h2>

    <div class="experience__body" grid gap="x-block" mb-60>
      <div class="experience__rail" aria-hidden="true" flex="~ col" items="center" gap="tight" typeset="code"
        text="sm muted">
        <span class="tabular-nums">{{ lastYear }}</span>
        <div ref="band" class="experience__band" :data-state="state" flex="~ col 1" @pointerdown="scrubStart"
          @pointermove="scrubMove" @pointerup="scrubEnd" @pointercancel="scrubEnd" @click.capture="scrubClick">
          <!-- Pointer shortcuts to the links on the roles themselves, so kept out of the tab
               order and the accessibility tree. -->
          <a v-for="(role, i) in roles" :key="role.slug" :href="`#role-${role.slug}`" tabindex="-1" draggable="false"
            class="experience__field" :class="{ 'is-lit': lit === role.slug, 'is-hovered': hovered === role.slug }"
            :style="{ '--months': role.months, '--i': i }" :data-slug="role.slug" @click="go($event, role.slug)"
            @pointerenter="point($event, role.slug)" @pointerleave="leave(role.slug)">
            <span v-for="{ item, at } in earned[role.slug]" :key="item.slug" class="experience__tick"
              :class="{ 'is-read': readout?.item === item }" :style="{ '--at': at }">
              <!-- The band is out of the accessibility tree, and the note
                   under the role says the same: pointer only. -->
              <SiteTooltip pointer-only>
                <template #tip>
                  <HomeEarnedTip :item="item" />
                </template>
              </SiteTooltip>
            </span>
          </a>
          <span ref="light" class="experience__light" :class="{ 'is-on': lightOn }" />
          <span v-if="readout" class="experience__readout" :style="{ '--y': `${readout.y}px` }" typeset="code"
            text="xs">
            <span class="tabular-nums">{{ formatMonth(readout.month) }}</span>
            <span v-if="readout.item">{{ readout.item.short }}</span>
          </span>
        </div>
        <span class="tabular-nums">{{ firstYear }}</span>
      </div>

      <ol class="experience__list" m="0" p="0" list="none">
        <li v-for="role in roles" :id="`role-${role.slug}`" ref="entries" :key="role.slug" :data-slug="role.slug"
          class="experience__entry" :class="{ 'is-lit': lit === role.slug, 'is-hovered': hovered === role.slug }"
          :data-state="waiting.has(role.slug) ? 'pending' : undefined" :style="{ '--batch': batch[role.slug] ?? 0 }"
          relative grid gap="x-group y-tight" pb="block" @pointerenter="point($event, role.slug)"
          @pointerleave="leave(role.slug)" @focusin="focus($event, role.slug)" @focusout="blur(role.slug)">
          <p class="experience__dates experience__piece tabular-nums" style="--j: 0" typeset="code" text="xs muted">
            <time :datetime="role.start">{{ formatMonth(role.start) }}</time>
            <span aria-hidden="true">&ensp;–&ensp;</span>
            <span class="sr-only">–</span>
            <time :datetime="role.end">{{ formatMonth(role.end) }}</time>
          </p>
          <div grid gap="tight">
            <h3 class="experience__piece" style="--j: 1" m="0">
              <a :href="`#role-${role.slug}`" class="experience__target text-fg decoration-none"
                @click="go($event, role.slug)">{{ role.role }}</a>
              <span text="muted" font="normal">·
                <a v-if="role.url" :href="role.url" class="experience__company" target="_blank" rel="noopener"
                  :aria-label="role.company">
                  <span aria-hidden="true">
                    <span v-for="(char, i) in role.company" :key="i" class="experience__char" :style="{ '--i': i }">{{
                      char }}</span>
                  </span>
                  <span class="experience__out i-iconoir-arrow-up-right" aria-hidden="true" />
                </a>
                <template v-else>{{ role.company }}</template>
              </span>
            </h3>
            <p v-for="(line, i) in role.summary" :key="i" class="experience__piece" :style="{ '--j': i + 2 }" m="0">{{
              line }}</p>
            <ul v-if="role.stack.length" class="experience__stack experience__piece"
              :style="{ '--j': role.summary.length + 2 }" my="tight" p="0" list="none" typeset="code" text="sm muted">
              <li v-for="tool in role.stack" :key="tool">{{ tool }}</li>
            </ul>
            <ul v-if="earned[role.slug]" class="experience__earned experience__piece"
              :style="{ '--j': role.summary.length + 3 }" m="0" mt="tight" p="0" list="none" grid typeset="code"
              text="sm muted">
              <li v-for="{ item } in earned[role.slug]" :key="item.slug" flex items="center" gap="tight">
                <span class="experience__square" aria-hidden="true" />
                <!-- Short in the line; the whole entry in its tooltip. -->
                <SiteTooltip>
                  {{ item.short }}
                  <template #tip>
                    <HomeEarnedTip :item="item" />
                  </template>
                </SiteTooltip>
                <span v-if="item.score" class="experience__score" aria-hidden="true" flex items="center">
                  <span v-for="area in item.score[1]" :key="area" class="experience__area"
                    :class="{ 'is-scored': area <= item.score[0] }" :style="{ '--k': area - 1 }" />
                </span>
                <span class="tabular-nums">
                  <time :datetime="item.start">{{ item.start.slice(0, 4) }}</time>
                  <template v-if="item.end">–<time :datetime="item.end">{{ item.end.slice(2, 4) }}</time></template>
                </span>
              </li>
            </ul>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.experience {
  /* Where the sticky header ends. On mobile the brand row tucks away and
     only the band stays (see main.css). */
  --stick-top: var(--header-height, 0px);
}

@media (width < 40rem) {
  .experience {
    --stick-top: calc(var(--header-height, 0px) - var(--header-tuck, 0px));
  }
}

/* The heading carries the stage color so roles scroll under it, as they do
   under the header. */
.experience__heading {
  position: sticky;
  top: var(--stick-top);
  /* Over the rail too, which scrolls up under it once the section runs out. */
  z-index: 2;
}

.experience__body {
  grid-template-columns: auto minmax(0, 1fr);
}

/* The rail sticks just under the heading and fills what's left of the
   viewport above the footer, up to a comfortable reading height. */
.experience__rail {
  position: sticky;
  /* Sticky makes it a stacking context: lifted, the scrub readout in it
     shows over the roles. */
  z-index: 1;
  top: calc(var(--stick-top) + var(--heading-height, 0px));
  align-self: start;
  block-size: min(32rem, calc(100svh - var(--stick-top) - var(--heading-height, 0px) - var(--footer-height, 0px) - var(--gap-block)));
}

/* Built like the flag band, bars with the stage showing between them, set
   closer. It takes vertical drags for scrubbing, so the page doesn't scroll
   under a finger on it (and swiping between pages leaves it alone). */
.experience__band {
  --band-gap: 2px;
  position: relative;
  gap: var(--band-gap);
  inline-size: var(--space-1);
  touch-action: none;
  user-select: none;
  -webkit-touch-callout: none;
}

.experience__field {
  position: relative;
  flex: var(--months) 1 0;
  min-block-size: var(--space-2);
  background-color: var(--line);
  transform-origin: top;
  transition:
    scale 700ms var(--ease-out) calc(var(--i) * 90ms),
    background-color 150ms var(--ease-out);
}

/* Pointed at but not being read: the field brightens, without the light. */
.experience__field.is-hovered:not(.is-lit) {
  background-color: var(--muted);
}

/* A wider hit area than the 4px bar. Fields touch through it, so the pointer
   never falls between two of them. */
.experience__field::before {
  content: '';
  position: absolute;
  inset: calc(-0.5 * var(--band-gap)) calc(-1 * var(--space-3));
}

/* A thumb gets a wider strip to land on. */
@media (pointer: coarse) {
  .experience__field::before {
    inset-inline: calc(-1 * var(--space-4));
  }
}

/* What's under the finger while scrubbing: beside the band, and lifted
   clear of a thumb on touch. */
.experience__readout {
  position: absolute;
  z-index: 2;
  inset-block-start: var(--y);
  inset-inline-start: calc(100% + var(--space-4));
  translate: 0 -50%;
  display: grid;
  gap: 2px;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--fg);
  white-space: nowrap;
  pointer-events: none;
}

@media (pointer: coarse) {
  .experience__readout {
    translate: 0 calc(-100% - var(--space-8));
  }
}

/*
 * The light, laid over the fields between its two edges (--top, --bottom,
 * from the springs). It glows like a neon tube (--glow, see main.css) and
 * comes on steady: a strike flicker read as dizzying, so the light just moves.
 */
.experience__light {
  position: absolute;
  inset-inline: 0;
  inset-block-start: var(--top, 0px);
  block-size: calc(var(--bottom, 0px) - var(--top, 0px));
  background-color: var(--hot);
  border: 1px solid var(--accent);
  box-shadow: var(--glow);
  mix-blend-mode: plus-lighter;
  pointer-events: none;
  opacity: 0;
  transition: opacity 300ms var(--ease-out);
}

.experience__light.is-on {
  opacity: 1;
}

.experience__band[data-state='pending'] .experience__light {
  opacity: 0;
  transition: none;
}

.experience__band[data-state='pending'] .experience__field {
  scale: 1 0;
  transition: none;
}

.experience__entry {
  scroll-margin-top: var(--heading-height, 0px);
  transition: opacity 250ms var(--ease-out);
  /* Keeps the company link's z-index inside its entry, so it scrolls under
     the sticky heading like the rest of the role. */
  isolation: isolate;
}

/* The role's link covers its whole entry, so the entry is one target; the
   company link sits above it. */
.experience__target::after {
  content: '';
  position: absolute;
  inset: 0;
}

.experience__company {
  position: relative;
  z-index: 1;
  text-decoration: none;
}

/*
 * The company writes itself as the lexicon's headwords do: letter by letter
 * it leans, softens fully casual and turns cursive, and the way out slides in
 * after it. Mono widths hold across every axis, so nothing beside it moves.
 * The arrow's room is kept, so it never pushes the line.
 */
@property --slnt {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}

@property --casl {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}

@property --crsv {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}

.experience__company {
  --slnt: 0;
  --casl: var(--heading-casual);
  --crsv: 0;
}

.experience__company:hover,
.experience__company:focus-visible {
  --slnt: -15;
  --casl: 1;
  --crsv: 1;
}

.experience__char {
  font-variation-settings: 'CASL' var(--casl), 'CRSV' var(--crsv), 'slnt' var(--slnt);
  transition:
    --slnt 450ms var(--ease-out),
    --casl 450ms var(--ease-out),
    --crsv 0ms;
  transition-delay: calc(var(--i) * 20ms);
}

.experience__company:hover .experience__char,
.experience__company:focus-visible .experience__char {
  transition:
    --slnt 600ms var(--ease-out),
    --casl 600ms var(--ease-out),
    --crsv 0ms;
  transition-delay:
    calc(var(--i) * 25ms),
    calc(var(--i) * 25ms),
    calc(var(--i) * 25ms + 60ms);
}

.experience__out {
  margin-inline-start: 0.15em;
  font-size: 0.85em;
  opacity: 0;
  translate: -0.3em 0.3em;
  transition:
    opacity 200ms var(--ease-out),
    translate 200ms var(--ease-out);
}

.experience__company:hover .experience__out,
.experience__company:focus-visible .experience__out {
  opacity: 1;
  translate: 0 0;
  transition-duration: 400ms;
  transition-delay: 120ms;
}

/* Touch has no hover to reveal it: the way out stays shown. */
@media not ((hover: hover) and (pointer: fine)) {
  .experience__out {
    opacity: 1;
    translate: 0 0;
  }
}

/* The stack is a run of names, not a row of tags: one muted line, comma
   separated, that reads as a footnote to the role. */
.experience__stack li {
  display: inline;
}

.experience__stack li+li::before {
  content: ', ';
}

/* Earned along the role: footnotes under the stack, set in from it. */
.experience__earned {
  gap: var(--space-1);
  padding-inline-start: var(--space-4);
}

/* Each one answers across its whole line, square and years included, not
   just its short name: a tap anywhere on it opens the tooltip, and the
   pointer previews it. The lines meet halfway across the gap between them. */
.experience__earned li {
  position: relative;
}

.experience__earned :deep(.site-tooltip__name) {
  position: static;
}

.experience__earned :deep(.site-tooltip__name)::before {
  content: '';
  position: absolute;
  z-index: 1;
  inset: calc(-0.5 * var(--space-1)) 0;
}

/* Each one's mark, and its month on the band: a square of the band's
   width, smaller beside the field so it reads as a point in time, not a
   bullet for the text across from it. Both light with the role. */
.experience__square,
.experience__tick {
  flex: none;
  inline-size: var(--space-2);
  block-size: var(--space-2);
  background-color: var(--muted);
  transition:
    background-color 250ms var(--ease-out),
    box-shadow 250ms var(--ease-out),
    scale 250ms var(--ease-out);
}

.experience__tick {
  position: absolute;
  z-index: 1;
  inset-block-start: calc(var(--at) * 100%);
  inset-inline-start: calc(100% + 3px);
  inline-size: 3px;
  block-size: 3px;
  translate: 0 -50%;
}

.experience__field.is-lit .experience__tick,
.experience__entry.is-lit .experience__square {
  background-color: var(--hot);
  box-shadow: var(--glow);
  mix-blend-mode: plus-lighter;
  transition-duration: 500ms;
}

/* Activated: the square under the pointer, or the one beside the name being
   read, burns hotter than its lit role and swells a little. */
.experience__field .experience__tick:is(:hover, .is-read),
.experience__earned li:has(.site-tooltip__name:hover, .site-tooltip__name:focus-visible) .experience__square {
  background-color: color-mix(in oklab, var(--accent), white 75%);
  box-shadow: var(--glow), 0 0 8px 2px color-mix(in oklab, var(--accent) 80%, transparent);
  mix-blend-mode: plus-lighter;
  transition-duration: 200ms;
}

.experience__field .experience__tick:is(:hover, .is-read) {
  scale: 1.8;
}

.experience__earned li:has(.site-tooltip__name:hover, .site-tooltip__name:focus-visible) .experience__square {
  scale: 1.3;
}

/* An award's score: one short field per evaluated area, built like the
   band's, with the stage showing between them. */
.experience__score {
  gap: 3px;
}

.experience__area {
  position: relative;
  inline-size: 3px;
  block-size: 1em;
  background-color: var(--line);
}

.experience__area::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: var(--accent);
  transform-origin: bottom;
  scale: 1 0;
  transition: scale 250ms var(--ease-out);
}

/* Lit with the role, the scored areas fill one after another and glow like
   its field. Emptying is quicker and all at once. */

.experience__entry.is-lit .experience__area.is-scored::after {
  scale: 1 1;
  background-color: var(--hot);
  box-shadow: var(--glow);
  mix-blend-mode: plus-lighter;
  transition-duration: 500ms;
  transition-delay: calc(var(--k) * 80ms);
}

/*
 * Arriving: each piece rises a little out of a soft blur, a beat after the
 * one above it. Roles arriving together follow each other (--batch), at the
 * band's own pace. Leaving the pending state is the only transition, so
 * nothing replays.
 */
.experience__piece {
  transition:
    opacity 600ms var(--ease-out),
    translate 700ms var(--ease-out),
    filter 600ms var(--ease-out);
  transition-delay: calc(var(--batch, 0) * 140ms + var(--j, 0) * 70ms);
}

.experience__entry[data-state='pending'] .experience__piece {
  opacity: 0;
  translate: 0 1rem;
  filter: blur(6px);
  transition: none;
}

@media (width >=48rem) {
  .experience__entry {
    grid-template-columns: 15ch minmax(0, 1fr);
  }

  /* Dates sit on the role's line, not the block's top edge. */
  .experience__dates {
    padding-block-start: 0.35em;
    white-space: nowrap;
  }
}

/* The lit role's dates light with its field: the same neon, as text. They
   come on with the field's fill and go out quicker, as it empties. Set on
   the dates' contents: the dates themselves carry the arrival. */
.experience__dates>* {
  transition:
    color 250ms var(--ease-out),
    text-shadow 250ms var(--ease-out);
}

.experience__entry.is-lit .experience__dates>* {
  color: var(--hot);
  text-shadow: var(--glow);
  mix-blend-mode: plus-lighter;
  transition-duration: 500ms;
}

/* Spotlight, as in the lexicon, on the role lit in the band: focused or
   being read. Until one is lit (or without JS) all stay full. A role pointed
   at comes part of the way forward, still behind the lit one. */
.experience__list:has(.is-lit) .experience__entry:not(.is-lit) {
  opacity: 0.4;
}

.experience__list:has(.is-lit) .experience__entry.is-hovered:not(.is-lit) {
  opacity: 0.7;
}

@media (prefers-reduced-motion: reduce) {

  /* The band still fills in, as a fade, without growing. */
  .experience__field {
    transition:
      opacity 200ms var(--ease-out),
      background-color 150ms var(--ease-out);
  }

  .experience__band[data-state='pending'] .experience__field {
    scale: none;
    opacity: 0;
  }

  /* Pieces still arrive in order, as a fade in place. */
  .experience__entry[data-state='pending'] .experience__piece {
    translate: none;
    filter: none;
  }

  .experience__piece {
    transition: opacity 300ms var(--ease-out);
    transition-delay: calc(var(--batch, 0) * 80ms + var(--j, 0) * 40ms);
  }

  /* Same end state, no ripple, no slide. */
  .experience__char,
  .experience__company:hover .experience__char,
  .experience__company:focus-visible .experience__char {
    transition-duration: 150ms, 150ms, 0ms;
    transition-delay: 0ms;
  }

  .experience__out {
    translate: none;
  }

  /* Scored areas fill as a fade in place. */
  .experience__area::after {
    scale: 1 1;
    opacity: 0;
    transition: opacity 150ms var(--ease-out);
  }

  .experience__entry.is-lit .experience__area.is-scored::after {
    opacity: 1;
    transition-delay: 0ms;
  }
}
</style>
