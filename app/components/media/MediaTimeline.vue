<script setup lang="ts">
/**
 * The media hub as one timeline: every release on a shared calendar, videos
 * standing up from the axis and episodes hanging below it, so the page reads
 * as when I made things and which of the two the time went to. A column is
 * the time published that month (a quarter on phones, where months would be
 * slivers), against the busiest on either side: both halves share one scale.
 * A month of videos is one bar; episodes stack a block each, as tall as it
 * runs. Should a feed come without lengths, a release counts as one.
 *
 * Each half is a door: its name (Videos, Podcast) links to its guide and
 * covers the half, and the word travels into the section's heading as a
 * project's does (utils/viewTransition.ts). Pointing anywhere along the
 * timeline reads that column out under it and steps the rest back; a finger
 * scrubs the same way. A table by year carries the same for screen readers.
 */
const props = defineProps<{
  videos: GuideSeries[]
  podcast: GuideSeries[]
}>()

const { t, n, locale } = useI18n()
// Months until hydrated, so the server's columns match; then quarters on phones.
const mounted = useMounted()
const phone = useMediaQuery('(width < 40rem)')
const narrow = computed(() => mounted.value && phone.value)

// A video can sit in more than one playlist; it was still made once.
const videos = computed(() => [...new Map(props.videos.flatMap((row) => row.releases).map((release) => [release.id, release])).values()])
const episodes = computed(() => props.podcast.flatMap((row) => row.releases))
const capped = computed(() => props.videos.some((row) => row.capped))
const timed = computed(() => [...videos.value, ...episodes.value].every((release) => release.duration))
const weightOf = (release: GuideRelease) => timed.value ? release.duration! : 1
const weigh = (releases: GuideRelease[]) => releases.reduce((total, release) => total + weightOf(release), 0)

// Buckets count from the first release's month (or quarter) to the last's.
const step = computed(() => narrow.value ? 3 : 1)
const monthOf = (date: string) => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1
const range = computed(() => {
  const months = [...videos.value, ...episodes.value].map(({ published }) => monthOf(published))
  const first = Math.min(...months)
  return { first: first - (first % step.value), last: Math.max(...months) }
})
const bucketOf = (date: string) => Math.floor((monthOf(date) - range.value.first) / step.value)

const columns = computed(() => {
  const count = Math.floor((range.value.last - range.value.first) / step.value) + 1
  const buckets = Array.from({ length: count }, (_, index) => {
    const month = range.value.first + index * step.value
    return { index, year: Math.floor(month / 12), month: month % 12, videos: [] as GuideRelease[], episodes: [] as GuideRelease[] }
  })
  for (const video of videos.value) buckets[bucketOf(video.published)]!.videos.push(video)
  for (const episode of episodes.value) buckets[bucketOf(episode.published)]!.episodes.push(episode)
  return buckets
})
const busiest = computed(() => Math.max(1, ...columns.value.flatMap((column) => [weigh(column.videos), weigh(column.episodes)])))
const sideOf = (slug: 'videos' | 'podcast') => slug === 'videos' ? 'videos' : 'episodes'

// The year marks along the axis, where each year's first column starts.
const years = computed(() => columns.value
  .filter((column) => column.month < step.value)
  .map((column) => ({ year: column.year, at: (column.index / columns.value.length) * 100 })))

const byYear = computed(() => years.value.map(({ year }) => {
  const of = (list: GuideRelease[]) => list.filter((release) => release.published.startsWith(String(year))).length
  return { year, videos: of(videos.value), episodes: of(episodes.value) }
}))

// "2017–2026" across a set of releases.
function span(releases: GuideRelease[]) {
  const dates = releases.map(({ published }) => published).sort()
  const from = dates[0]?.slice(0, 4)
  const to = dates.at(-1)?.slice(0, 4)
  return from === to ? from : `${from}–${to}`
}
const hours = (releases: GuideRelease[]) => n(releases.reduce((total, { duration = 0 }) => total + duration, 0) / 3600, { maximumFractionDigits: 1 })

const halves = computed(() => [
  {
    slug: 'videos' as const,
    title: t('videos.title'),
    intro: t('videos.intro'),
    stats: `${t('media.guide.playlists', props.videos.length)} · ${t('media.guide.videos', { count: capped.value ? `${videos.value.length}+` : videos.value.length }, videos.value.length)} · ${span(videos.value)}`,
  },
  {
    slug: 'podcast' as const,
    title: t('podcast.title'),
    intro: t('podcast.intro'),
    stats: `${t('media.guide.episodes', episodes.value.length)} · ${span(episodes.value)} · ${hours(episodes.value)} h`,
  },
])

// The column being read: what's under the pointer or finger along the axis.
const reading = ref<number | null>(null)
const axis = useTemplateRef<HTMLElement>('axis')
function read(event: PointerEvent) {
  const box = axis.value?.getBoundingClientRect()
  if (!box || event.clientX < box.left || event.clientX > box.right) return (reading.value = null)
  const column = Math.min(columns.value.length - 1, Math.floor(((event.clientX - box.left) / box.width) * columns.value.length))
  // A finger feels each column it passes, and hears how busy it was.
  if (touch?.scrubbing && reading.value !== null && column !== reading.value) {
    const { videos, episodes } = columns.value[column]!
    haptic('tick', Math.max(weigh(videos), weigh(episodes)) / busiest.value)
  }
  reading.value = column
}

// A finger reads only once it's scrubbing, moving sideways more than down.
// Until then it may be scrolling the page, and reading would flash every
// other column back and forth with each swipe. It reads only from the bars;
// set down anywhere else, a sideways drag swipes to the next page.
const SLOP = 8
let touch: { x: number, y: number, scrubbing: boolean } | null = null
function press(event: PointerEvent) {
  if (event.pointerType !== 'touch') return read(event)
  touch = (event.target as Element).closest('.timeline__bars') ? { x: event.clientX, y: event.clientY, scrubbing: false } : null
}
function move(event: PointerEvent) {
  if (event.pointerType === 'touch' && !touch) return
  if (touch && !touch.scrubbing) {
    const dx = Math.abs(event.clientX - touch.x)
    if (dx < SLOP || dx < Math.abs(event.clientY - touch.y)) return
    touch.scrubbing = true
  }
  read(event)
}
function release() {
  touch = null
  reading.value = null
}

const monthFormat = computed(() => new Intl.DateTimeFormat(locale.value, { month: 'short', year: 'numeric', timeZone: 'UTC' }))
const nameOf = (column: { year: number, month: number }) => {
  const from = monthFormat.value.format(Date.UTC(column.year, column.month))
  return step.value === 1 ? from : `${from} – ${monthFormat.value.format(Date.UTC(column.year, column.month + step.value - 1))}`
}
const readout = computed(() => {
  if (reading.value === null) {
    const { first, last } = range.value
    return { when: `${monthFormat.value.format(Date.UTC(Math.floor(first / 12), first % 12))} → ${monthFormat.value.format(Date.UTC(Math.floor(last / 12), last % 12))}`, videos: null, episodes: null }
  }
  const column = columns.value[reading.value]!
  const of = (key: string, releases: GuideRelease[]) => `${t(key, releases.length)}${timed.value && releases.length ? ` (${hours(releases)} h)` : ''}`
  return {
    when: nameOf(column),
    videos: of('media.guide.videos', column.videos),
    episodes: of('media.guide.episodes', column.episodes),
  }
})
</script>

<template>
  <div class="timeline" :class="{ 'is-reading': reading !== null }" :style="{ '--columns': columns.length }" @pointerdown="press" @pointermove="move" @pointercancel="release" @pointerleave="release">
    <section v-for="half in halves" :key="half.slug" class="timeline__half" :class="`timeline__half--${half.slug}`" :aria-labelledby="`half-${half.slug}`">
      <div class="timeline__label">
        <h2 :id="`half-${half.slug}`" class="timeline__word text-headword" m="0" typeset="heading">
          <NuxtLinkLocale :to="`/${half.slug}`" class="timeline__link" decoration="none">
            <span :style="mediaTransition(half.slug)">
              <!-- One span per letter so the hover can ripple through the word.
                   Assistive tech gets the whole word from the hidden copy. -->
              <span class="sr-only">{{ half.title }}</span>
              <span aria-hidden="true">
                <span v-for="(char, i) in half.title" :key="i" class="timeline__char" :style="{ '--i': i }">{{ char }}</span>
              </span>
            </span>
          </NuxtLinkLocale>
          <span class="timeline__arrow" aria-hidden="true">→</span>
        </h2>
        <p m="0" text="sm">{{ half.intro }}</p>
        <p class="timeline__stats" m="0" text="sm muted">{{ half.stats }}</p>
      </div>

      <!-- The bars are a door to the same page, over the half's link, so a
           finger on them is told apart from one on the label. -->
      <NuxtLinkLocale :to="`/${half.slug}`" class="timeline__bars" decoration="none" tabindex="-1" aria-hidden="true">
        <div
          v-for="column in columns"
          :key="column.index"
          class="timeline__column"
          :class="{ 'is-read': column.index === reading }"
          :style="{ '--t': column.index / Math.max(1, columns.length - 1), 'block-size': `${(weigh(column[sideOf(half.slug)]) / busiest) * 100}%` }"
        >
          <!-- A month of videos is one bar: a short video would be a block
               thinner than its gap, and dozens of them shimmered as the page
               scrolled. Episodes run long enough to stay apart. -->
          <span v-if="half.slug === 'videos'" class="timeline__block" />
          <span v-for="release in column.episodes" v-else :key="release.id" class="timeline__block" :style="{ flexGrow: weightOf(release) }" />
        </div>
      </NuxtLinkLocale>
    </section>

    <div ref="axis" class="timeline__axis" aria-hidden="true">
      <span v-for="mark in years" :key="mark.year" class="timeline__year" :style="{ insetInlineStart: `${mark.at}%` }">{{ mark.year }}</span>
    </div>

    <p class="timeline__readout" data-stick m="0" text="sm muted" aria-hidden="true">
      <span class="timeline__line" text="[var(--fg)]">{{ readout.when }}</span>
      <span class="timeline__line">{{ readout.videos ? `${readout.videos} · ${readout.episodes}` : '' }}</span>
    </p>

    <table class="sr-only">
      <thead>
        <tr>
          <td />
          <th scope="col">{{ t('videos.title') }}</th>
          <th scope="col">{{ t('podcast.title') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in byYear" :key="row.year">
          <th scope="row">{{ row.year }}</th>
          <td>{{ row.videos }}</td>
          <td>{{ row.episodes }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/*
 * Two columns from 40rem: the names on the left, the timeline on the right,
 * videos above the axis and the podcast below it. Each half is a subgrid row
 * so its link can cover the name and the bars as one door.
 */
.timeline {
  --half: clamp(5rem, 16vh, 9rem);
  display: grid;
  grid-template-columns: minmax(12rem, 18rem) minmax(0, 1fr);
  column-gap: var(--gap-block);
}

.timeline__half {
  position: relative;
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  transition: opacity 250ms var(--ease-out);
}

.timeline__half--videos {
  grid-row: 2;
}

.timeline__half--podcast {
  grid-row: 4;
}

.timeline__label {
  display: grid;
  align-content: end;
  gap: var(--gap-tight);
  padding-block: var(--gap-group);
}

.timeline__half--podcast .timeline__label {
  align-content: start;
}

.timeline__word {
  display: flex;
  align-items: baseline;
  gap: var(--gap-group);
}

.timeline__link {
  --slnt: 0;
  --casl: var(--heading-casual);
  --crsv: 0;
  color: var(--fg);
}

/* The link covers its whole half, so a half is one target. */
.timeline__link::after {
  content: '';
  position: absolute;
  inset: 0;
}

.timeline__link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}

.timeline__stats,
.timeline__readout,
.timeline__year {
  font-variant-numeric: tabular-nums;
}

.timeline__arrow {
  color: var(--muted);
  font-size: 1.5rem;
  line-height: 1;
  transition: translate 250ms var(--ease-out), color 250ms var(--ease-out);
}

/* Sideways along the bars is the finger's to read with; up and down still
   scrolls the page. Anywhere else in the timeline, it swipes between pages. */
.timeline__bars {
  touch-action: pan-y;
  -webkit-touch-callout: none;
}

/*
 * The bars: a column per month, as tall as its count against the busiest,
 * its blocks split evenly in it. Videos stand on the axis; episodes hang
 * from it. Videos sit at 78% as on their guide, so the halves read apart.
 */
.timeline__bars {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
  align-items: end;
  column-gap: 1px;
  block-size: var(--half);
}

.timeline__half--podcast .timeline__bars {
  align-items: start;
}

.timeline__column {
  display: flex;
  flex-direction: column;
  gap: 1px;
  /* A month of many short videos has more gaps than height; it never spills
     over the axis. */
  overflow: clip;
  transform-origin: bottom;
  transition: opacity 200ms var(--ease-out);
  /* Backwards, not both: once grown, a column drops its animation and its
     layer. Held, every column scrolled as a layer of its own, each snapped
     to the pixel grid apart, and the thin blocks shimmered. */
  animation: 700ms var(--ease-out) calc(150ms + var(--t) * 650ms) backwards timeline-grow;
}

.timeline__half--podcast .timeline__column {
  transform-origin: top;
}

.timeline__block {
  flex: 1 1 0;
  min-block-size: 0;
  background: color-mix(in srgb, var(--fg) 78%, transparent);
}

.timeline__half--podcast .timeline__block {
  background: var(--fg);
}

/* The time runs left to right as it did: columns grow out of the axis in
   order, oldest first. */
@keyframes timeline-grow {
  from {
    scale: 1 0;
  }
}

/* Reading a column steps the rest back, on both sides of the axis. */
.timeline.is-reading .timeline__column:not(.is-read) {
  opacity: 0.4;
}

.timeline__axis {
  position: relative;
  grid-row: 3;
  grid-column: 2;
  block-size: 1.5rem;
  background: linear-gradient(var(--line), var(--line)) top / 100% 1px no-repeat;
}

.timeline__year {
  position: absolute;
  inset-block-start: 0.25rem;
  font-size: 0.75rem;
  line-height: 1;
  color: var(--muted);
}

/* What's being read heads the timeline, clear of a finger on it. */
.timeline__readout {
  grid-column: 2;
  grid-row: 1;
}

/* Two lines, always, each kept to one: when, then what. Whatever is read,
   the readout keeps its height and nothing under it moves. */
.timeline__line {
  display: block;
  block-size: 1lh;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* The word writes itself, as a project's does (see ProjectLexicon). */
.timeline__char {
  font-variation-settings: 'CASL' var(--casl), 'CRSV' var(--crsv), 'slnt' var(--slnt);
  transition:
    --slnt 450ms var(--ease-out),
    --casl 450ms var(--ease-out),
    --crsv 0ms;
  transition-delay: calc(var(--i) * 30ms);
}

.timeline__link:focus-visible {
  --slnt: -15;
  --casl: 1;
  --crsv: 1;
}

.timeline__link:focus-visible .timeline__char {
  transition:
    --slnt 600ms var(--ease-out),
    --casl 600ms var(--ease-out),
    --crsv 0ms;
  transition-delay:
    calc(var(--i) * 35ms),
    calc(var(--i) * 35ms),
    calc(var(--i) * 35ms + 60ms);
}

.timeline__half:has(.timeline__link:focus-visible) .timeline__arrow {
  translate: 0.5rem 0;
  color: var(--fg);
}

.timeline__half:has(.timeline__link:active, .timeline__bars:active) {
  opacity: 0.7;
}

@media (hover: hover) and (pointer: fine) {
  .timeline__half:hover .timeline__link {
    --slnt: -15;
    --casl: 1;
    --crsv: 1;
  }

  .timeline__half:hover .timeline__char {
    transition:
      --slnt 600ms var(--ease-out),
      --casl 600ms var(--ease-out),
      --crsv 0ms;
    transition-delay:
      calc(var(--i) * 35ms),
      calc(var(--i) * 35ms),
      calc(var(--i) * 35ms + 60ms);
  }

  .timeline__half:hover .timeline__arrow {
    translate: 0.5rem 0;
    color: var(--fg);
  }
}

@media (prefers-reduced-motion: reduce) {
  /* The columns are simply there; the word changes without the ripple. */
  .timeline__column {
    animation: 200ms linear backwards timeline-fade;
  }

  .timeline__char,
  .timeline__half:hover .timeline__char,
  .timeline__link:focus-visible .timeline__char {
    transition-duration: 150ms, 150ms, 0ms;
    transition-delay: 0ms;
  }

  .timeline__arrow {
    transition-duration: 0ms;
  }
}

@keyframes timeline-fade {
  from {
    opacity: 0;
  }
}

/* Phones: one column, the names above and below the timeline they own.
   Every other year is marked, so they don't run into each other. */
@media (width < 40rem) {
  .timeline {
    grid-template-columns: minmax(0, 1fr);
  }

  .timeline__half--podcast .timeline__label {
    order: 1;
  }

  .timeline__axis,
  .timeline__readout {
    grid-column: 1;
  }

  /* The timeline is taller than what's left under the band, so the line
     that reads it out sticks just under the band while the timeline is on
     screen, in its own copy of the stage for the bars to pass under, as
     the header does. */
  .timeline__readout {
    position: sticky;
    inset-block-start: calc(var(--header-height, 0px) - var(--header-tuck, 0px));
    z-index: 1;
    padding-block: var(--gap-tight);
    background: var(--bg);
  }

  .timeline__year:nth-child(even):not(:last-child) {
    visibility: hidden;
  }
}
</style>
