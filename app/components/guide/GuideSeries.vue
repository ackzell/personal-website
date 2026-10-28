<script setup lang="ts">
/**
 * A guide to a set of series, like a programming guide. A row is a playlist
 * (or a podcast season) drawn as a strip with one cell per release; a cell is
 * as tall as the release is long and darker the more it was viewed or
 * downloaded. A podcast season is one line, oldest first, its bars as tall as
 * the episodes run. A playlist keeps its own order (a course is a sequence,
 * whatever the dates say) and runs as a reel: cells of one height, each as wide
 * as the video runs, wrapping onto new lines, so a row's length is its runtime. Pointing at or focusing a cell reads out what
 * it is under the row; the name opens the releases to browse, with the way out.
 * The items themselves live on YouTube and mytypeof.dev.
 */
const props = defineProps<{ series: GuideSeries[] }>()

const { t, n, locale } = useI18n()

const dateFormat = computed(() => new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }))
const formatDate = (date: string) => dateFormat.value.format(new Date(`${date}T00:00:00Z`))

// 19:50, or 1:02:10 past the hour.
const pad = (value: number) => String(value).padStart(2, '0')
function formatLength(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h ? `${h}:${pad(m)}:${pad(seconds % 60)}` : `${m}:${pad(seconds % 60)}`
}

// A figure is a number and its unit, split out of the message that says both
// ("{count} views"), so each language keeps its own plural and word order.
type Figure = { value: string, unit?: string }
const MARK = '\u0001'
function figure(key: string, value: string, plural: number): Figure {
  const unit = t(key, { count: MARK }, plural).replace(MARK, '').trim()
  return { value, unit }
}

// A release's figures, in a fixed order: its place in the playlist, when, how
// long, how many watched or downloaded.
function figures(release: GuideRelease, number?: number): Figure[] {
  return [
    ...(number ? [{ value: `#${number}` }] : []),
    { value: formatDate(release.published) },
    ...(release.duration ? [{ value: formatLength(release.duration) }] : []),
    ...(release.views ? [figure('media.guide.views', n(release.views), release.views)] : []),
    ...(release.downloads ? [figure('media.guide.downloads', n(release.downloads), release.downloads)] : []),
  ]
}

// A strip is as long as its series has releases, against the longest on the
// page, so a playlist with a dozen videos never reads as a sliver the way it
// would on a shared calendar. The dates stay in the row's text.
const most = computed(() => Math.max(1, ...props.series.map((row) => row.releases.length)))
const longest = computed(() => Math.max(1, ...props.series.flatMap((row) => row.releases.map((release) => release.duration ?? 0))))
// What each release drew (downloads, or views), lowest first, to rank it
// against the rest.
const drawn = (release: GuideRelease) => release.downloads ?? release.views
const ranked = computed(() => props.series.flatMap((row) => row.releases.flatMap((release) => drawn(release) ?? [])).sort((a, b) => a - b))
const shadeOf = (release: GuideRelease) => {
  const count = drawn(release)
  return count === undefined ? undefined : 22 + (ranked.value.indexOf(count) / Math.max(1, ranked.value.length - 1)) * 78
}
// An episode stands as tall as it runs.
const heightOf = (release: GuideRelease) => release.duration ? `${Math.max(18, (release.duration / longest.value) * 100)}%` : undefined

const podcast = computed(() => props.series.some((row) => row.kind === 'podcast'))
const hasBars = computed(() => props.series.some((row) => row.releases.some((release) => release.duration)))
const hasViews = computed(() => props.series.some((row) => row.kind === 'playlist' && row.releases.some((release) => release.views !== undefined)))

const rows = computed(() => props.series.map((row) => {
  // A season is read oldest first; a playlist is in the order it was made in.
  const releases = row.kind === 'podcast' ? [...row.releases].sort((a, b) => a.published.localeCompare(b.published)) : row.releases
  const dates = releases.map(({ published }) => published).sort()
  const from = dates[0]!
  const to = dates.at(-1)!
  const downloads = releases.reduce((total, release) => total + (release.downloads ?? 0), 0)
  const views = releases.reduce((total, release) => total + (release.views ?? 0), 0)
  const hours = releases.reduce((total, release) => total + (release.duration ?? 0), 0) / 3600

  // 15 videos is the public feed's ceiling, not a count: "15+ videos".
  const totals: Figure[] = [
    figure(row.kind === 'podcast' ? 'media.guide.episodes' : 'media.guide.videos', row.capped ? `${releases.length}+` : String(releases.length), releases.length),
    { value: from.slice(0, 4) === to.slice(0, 4) ? from.slice(0, 4) : `${from.slice(0, 4)}–${to.slice(0, 4)}` },
    ...(hours ? [{ value: n(hours, { maximumFractionDigits: 1 }), unit: 'h' }] : []),
    ...(views ? [figure('media.guide.views', n(views), views)] : []),
    ...(downloads ? [figure('media.guide.downloads', n(downloads), downloads)] : []),
  ]
  return {
    row,
    cells: releases.map((release, index) => ({
      release,
      // What a cell is, for screen readers; the readout draws the same
      // from the title and the figures.
      label: [
        row.kind === 'playlist' ? `${index + 1}` : '',
        formatDate(release.published),
        release.title,
        release.duration ? formatLength(release.duration) : '',
        release.downloads ? t('media.guide.downloads', { count: n(release.downloads) }) : '',
        release.views ? t('media.guide.views', { count: n(release.views) }) : '',
      ].filter(Boolean).join(' · '),
      figures: figures(release, row.kind === 'playlist' ? index + 1 : undefined),
      // A season's bars are as tall as the episodes run; a playlist's cells
      // are as wide, in minutes (see `--min`).
      height: row.kind === 'podcast' ? heightOf(release) : undefined,
      minutes: release.duration ? release.duration / 60 : undefined,
      // How strongly it's drawn, as a percentage, by where its downloads or
      // views rank among all (22 for the fewest, 100 for the most). Against
      // the top count they all bunch up: one release far outdraws the rest.
      shade: shadeOf(release),
    })),
    // A season is as long as its share of the longest; a playlist wraps.
    width: row.kind === 'podcast' ? `${(releases.length / most.value) * 100}%` : undefined,
    bars: releases.some((release) => release.duration),
    // Past this many, the strip is an overview and the list is the way in.
    big: row.kind === 'playlist' && releases.length > 12,
    totals,
    idle: `${formatDate(from)} → ${formatDate(to)}`,
    all: releases.map((release, index) => ({ release, number: index + 1 })),
  }
}))

// Which cell is being read out in each row (the line under the strip, which
// also serves the keyboard), and which video's still is on show: only the one
// pointed at, so nothing is fetched until then.
const reading = ref<Record<string, { title: string, figures: Figure[], id: string }>>({})
const open = ref(new Set<string>())
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

// Opening a row brings it to the top of the page: the list is what's wanted
// now, and it's longer than the screen.
async function toggle(id: string, event: MouseEvent) {
  const row = (event.currentTarget as HTMLElement).closest('.guide__row')
  const next = new Set(open.value)
  const closing = next.delete(id)
  if (!closing) next.add(id)
  open.value = next
  if (closing) return
  await nextTick()
  row?.scrollIntoView({ block: 'start', behavior: reducedMotion.value ? 'auto' : 'smooth' })
}

// The key is for reading the strips. While an open list is on screen the
// strips aren't what's being read, so it steps aside.
const listed = ref(new Set<string>())
let watcher: IntersectionObserver | undefined
function watchPanel(element: unknown) {
  if (!(element instanceof HTMLElement)) return
  watcher ??= new IntersectionObserver((entries) => {
    const next = new Set(listed.value)
    for (const { target, isIntersecting } of entries) {
      if (isIntersecting) next.add((target as HTMLElement).id)
      else next.delete((target as HTMLElement).id)
    }
    listed.value = next
  })
  watcher.observe(element)
}
onBeforeUnmount(() => watcher?.disconnect())

// The list under an open row: in the playlist's order, or by what was
// watched or how long it runs, narrowed by a word in the title. It starts at
// a dozen and opens out on request, so 89 stills aren't asked for at once.
type Order = 'order' | 'views' | 'length'
const orders: Order[] = ['order', 'views', 'length']
const order = ref<Record<string, Order>>({})
const query = ref<Record<string, string>>({})
const everything = ref(new Set<string>())
const PAGE = 12

function browse(id: string, all: { release: GuideRelease, number: number }[]) {
  const word = (query.value[id] ?? '').trim().toLowerCase()
  const found = word ? all.filter(({ release }) => release.title.toLowerCase().includes(word)) : [...all]
  const by = order.value[id] ?? 'order'
  if (by === 'views') found.sort((a, b) => (b.release.views ?? 0) - (a.release.views ?? 0))
  else if (by === 'length') found.sort((a, b) => (b.release.duration ?? 0) - (a.release.duration ?? 0))
  return { found, shown: everything.value.has(id) ? found : found.slice(0, PAGE) }
}

function showAll(id: string) {
  everything.value = new Set(everything.value).add(id)
}

// YouTube's own still for a video.
const still = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
</script>

<template>
  <div class="guide">
    <!-- A key to the marks, pinned top right under the header while the guide is on screen. The marks are drawn
         with the strip's own cell styles, so key and strip can't drift. -->
    <aside class="guide__legend" :aria-label="t('media.guide.legend.label')">
      <p class="guide__legend-in" :class="{ 'guide__legend-in--away': listed.size }" m="0" text="xs muted">
        <template v-if="hasBars">
          <span class="guide__key">
            <span class="guide__swatch" :class="podcast ? 'guide__swatch--bars' : 'guide__swatch--runs'" aria-hidden="true"><i /><i /></span>
            {{ t(podcast ? 'media.guide.legend.length' : 'media.guide.legend.videoLength') }}
          </span>
          <span class="guide__key">
            <span class="guide__swatch guide__swatch--ramp" aria-hidden="true" />
            {{ t(hasViews ? 'media.guide.legend.views' : 'media.guide.legend.downloads') }}
          </span>
        </template>
        <span class="guide__key">{{ t(podcast ? 'media.guide.legend.episodes' : hasBars ? 'media.guide.legend.bars' : 'media.guide.legend.videos') }}</span>
      </p>
    </aside>
    <div role="list" :aria-label="t('media.guide.label')">
      <section v-for="{ row, cells, width, range, totals, idle, bars, big, all } in rows" :key="row.id"
        class="guide__row" role="listitem">
        <div class="guide__who">
          <h2 m="0" class="guide__name">
            <button type="button" :aria-expanded="open.has(row.id)" :aria-controls="`guide-${row.id}`"
              @click="toggle(row.id, $event)">
              {{ row.title }}
            </button>
          </h2>
          <p class="guide__stats" m="0" text="sm"><GuideFigures :figures="totals" /></p>
          <p v-if="row.note" class="guide__note" m="0" text="sm muted">{{ row.note }}</p>
        </div>

        <div class="guide__right">
          <div class="guide__strip"
            :class="{ 'guide__strip--bars': bars, 'guide__strip--wrap': row.kind === 'playlist' }"
            :style="{ '--cells': cells.length, 'inline-size': width }" :aria-hidden="big || undefined">
            <a v-for="cell in cells" :key="cell.release.id" class="guide__cell" :href="cell.release.url"
              :aria-label="cell.label" :tabindex="big ? -1 : undefined"
              :style="{ height: cell.height, '--min': cell.minutes, '--shade': cell.shade }"
              @pointerenter="reading[row.id] = { title: cell.release.title, figures: cell.figures, id: cell.release.id }"
              @focus="reading[row.id] = { title: cell.release.title, figures: cell.figures, id: cell.release.id }"
              @pointerleave="delete reading[row.id]" @blur="delete reading[row.id]">
              <SiteTooltip v-if="row.kind === 'playlist'" pointer-only pass-taps placement="top">
                <template #tip>
                  <span class="guide__still">
                    <img v-if="reading[row.id]?.id === cell.release.id" :src="still(cell.release.id)" alt="" width="320"
                      height="180">
                  </span>
                </template>
              </SiteTooltip>
            </a>
          </div>
          <p class="guide__read" m="0" text="sm" aria-hidden="true">
            <template v-if="reading[row.id]">
              <span class="guide__read-title">{{ reading[row.id]!.title }}</span>
              <GuideFigures :figures="reading[row.id]!.figures" />
            </template>
            <span v-else class="guide__idle">{{ idle }}</span>
          </p>
        </div>

        <div :id="`guide-${row.id}`" :ref="watchPanel" class="guide__panel" :hidden="!open.has(row.id)">
          <div v-if="row.kind === 'playlist' && all.length > 4" class="guide__tools">
            <div class="guide__orders" role="group" :aria-label="t('media.guide.sort.label')">
              <button v-for="by in orders" :key="by" type="button" :aria-pressed="(order[row.id] ?? 'order') === by"
                @click="order[row.id] = by">
                {{ t(`media.guide.sort.${by}`) }}
              </button>
            </div>
            <input v-if="big" v-model="query[row.id]" class="guide__find" type="search"
              :aria-label="t('media.guide.find')" :placeholder="t('media.guide.find')">
          </div>
          <template v-if="open.has(row.id)">
            <ol class="guide__list" list-none p="0" m="0">
              <li v-for="{ release, number } in browse(row.id, all).shown" :key="release.id">
                <a :href="release.url" class="guide__item">
                  <img v-if="row.kind === 'playlist'" class="guide__thumb" :src="still(release.id)" alt="" width="160"
                    height="90" loading="lazy">
                  <span class="guide__title">{{ release.title }}</span>
                  <GuideFigures class="guide__meta" text="sm"
                    :figures="figures(release, row.kind === 'playlist' ? number : undefined)" />
                </a>
              </li>
            </ol>
            <p v-if="!browse(row.id, all).found.length" m="0" text="sm muted">{{ t('media.guide.none') }}</p>
            <p v-else-if="browse(row.id, all).shown.length < browse(row.id, all).found.length" m="0" text="sm">
              <button type="button" class="guide__more" @click="showAll(row.id)">
                {{ t('media.guide.showAll', { count: n(browse(row.id, all).found.length) }) }}
              </button>
            </p>
          </template>
          <p m="0" text="sm">
            <NuxtLinkLocale v-if="row.project" :to="`/projects/${row.project}`" class="guide__project">{{ row.project }}
            </NuxtLinkLocale>
            <a :href="row.url">{{ $t(row.kind === 'podcast' ? 'media.guide.openPodcast' : 'media.guide.openPlaylist') }}
              ↗</a>
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.guide {
  --label: 17rem;
}

/* Zero-height sticky anchor: the key rides top right beneath the header and
   scrolls away with the guide. */
.guide__legend {
  position: sticky;
  inset-block-start: calc(var(--header-height, 0px) + var(--gap-tight));
  z-index: 5;
  block-size: 0;
}

.guide__legend-in {
  position: absolute;
  /* Centered in what the header leaves of the screen (the anchor sits a
     tight gap below the header). */
  inset-block-start: calc((100svh - var(--header-height, 0px)) / 2 - var(--gap-tight));
  translate: 0 -50%;
  inset-inline-end: -2rem;
  display: grid;
  gap: 0.25rem;
  inline-size: 12rem;
  padding: 0.5rem;
  background: var(--bg);
}

.guide__legend-in--away {
  opacity: 0;
  visibility: hidden;
}

@media (prefers-reduced-motion: no-preference) {
  .guide__legend-in {
    transition: opacity 0.2s var(--ease-out), visibility 0.2s;
  }
}

.guide__key {
  display: inline-flex;
  gap: 0.6ch;
  align-items: center;
}

.guide__swatch {
  display: inline-flex;
  gap: 2px;
  align-items: end;
  block-size: 0.875rem;
}

.guide__swatch--bars i {
  inline-size: 4px;
  background: color-mix(in oklab, var(--fg) 78%, transparent);
}

.guide__swatch--runs i {
  block-size: 100%;
  background: color-mix(in oklab, var(--fg) 78%, transparent);
}

.guide__swatch--runs i:first-child {
  inline-size: 4px;
}

.guide__swatch--runs i:last-child {
  inline-size: 12px;
}

.guide__swatch--bars i:first-child {
  block-size: 40%;
}

.guide__swatch--bars i:last-child {
  block-size: 100%;
}

.guide__swatch--ramp {
  inline-size: 2.5rem;
  block-size: 0.5rem;
  background: linear-gradient(to right, color-mix(in oklab, var(--fg) 22%, transparent), var(--fg));
}

.guide__row {
  display: grid;
  grid-template-columns: var(--label) minmax(0, 1fr);
  column-gap: var(--gap-block);
}

/* Playlists stand well apart from each other; what's inside one stays close.
   The margin is the room left above an opened row that was scrolled to. */
.guide__row {
  scroll-margin-block-start: var(--gap-group);
  padding-block: var(--gap-block);
  row-gap: var(--gap-group);
}

.guide__who {
  display: grid;
  gap: 0.25rem;
  align-content: start;
  min-width: 0;
}

.guide__name {
  font-family: var(--font-heading);
  font-variation-settings: 'CASL' var(--heading-casual);
  font-size: 1.125rem;
  line-height: 1.2;
}

.guide__name button {
  all: unset;
  cursor: pointer;
  display: flex;
  gap: 0.6ch;
  align-items: baseline;
  font-family: var(--font-heading);
  font-variation-settings: 'CASL' var(--heading-casual);
  font-size: 1.125rem;
  line-height: 1.2;
}

.guide__name button::after {
  content: '+';
  color: var(--muted);
  font-family: var(--font-body);
}

.guide__name button[aria-expanded='true']::after {
  content: '−';
}

.guide__name button:hover {
  text-decoration: underline;
  text-decoration-color: color-mix(in oklab, currentColor 40%, transparent);
  text-underline-offset: 0.2em;
}

.guide__name button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}

.guide__stats {
  line-height: 1.5;
}

/* A separate thought from the name and its figures, so it stands off from them. */
.guide__note {
  max-width: 34ch;
  margin-block-start: var(--gap-tight);
}

.guide__right {
  min-width: 0;
  display: grid;
  gap: var(--gap-tight);
  align-content: start;
}

/* One cell per release; the strip is as wide as its share of the longest. */
.guide__strip {
  display: grid;
  grid-template-columns: repeat(var(--cells), minmax(0, 1fr));
  gap: 3px;
  align-items: end;
}

/* A playlist's cell is a frame. */
.guide__cell {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  background: color-mix(in oklab, var(--fg) 78%, transparent);
  transition: background-color 0.15s var(--ease-out);
}

/* A playlist wraps into lines of fixed cells (a frame, or a bar where lengths
   are known) so the block's area is how much there is. Bars stand in rows of
   a fixed height, tallest the longest. */
.guide__strip--wrap {
  --cell: 1.125rem;
  grid-template-columns: repeat(auto-fill, var(--cell));
  gap: 3px;
}

/* Where lengths are known a playlist is a reel: one height, each cell as wide
   as the video runs (a tenth of a rem a minute, never thinner than can be
   pointed at), and a line ends when the next doesn't fit. */
.guide__strip--wrap.guide__strip--bars {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 2px;
  block-size: auto;
}

.guide__strip--wrap.guide__strip--bars .guide__cell {
  flex: none;
  block-size: 1.75rem;
  inline-size: clamp(0.4rem, calc(var(--min, 3) * 0.1rem), 100%);
}

/* An episode's (or a video's, where its length is known) is a bar, shaded by its downloads or views. */
.guide__strip--bars {
  block-size: 3.5rem;
}

.guide__strip--bars .guide__cell {
  aspect-ratio: auto;
}

.guide__strip .guide__cell {
  background: color-mix(in oklab, var(--fg) calc(var(--shade, 78) * 1%), transparent);
}

.guide__strip .guide__cell:hover,
.guide__strip .guide__cell:focus-visible {
  background: var(--fg);
}

.guide__cell:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* A video's tooltip (SiteTooltip) trails the pointer with its own still at
   16:9; the line under the strip says what it is. The box holds the shape
   while the still loads. */
.guide__still {
  display: block;
  inline-size: 14rem;
  max-inline-size: 100%;
  aspect-ratio: 16 / 9;
  background: color-mix(in oklab, var(--bg) 25%, transparent);
}

.guide__still img {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

/* The title is the line, its figures the line under it, so neither crowds the
   other. Both lines stay reserved, so reading a cell never moves the page. */
.guide__read {
  display: grid;
  align-content: start;
  min-height: 3em;
  overflow: hidden;
  white-space: nowrap;
}

.guide__read :deep(.figures) {
  flex-wrap: nowrap;
}

.guide__read-title {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.guide__idle {
  color: var(--muted);
  font-family: var(--font-code);
  font-variation-settings: 'CASL' 0;
  font-variant-numeric: tabular-nums;
}

.guide__panel {
  grid-column: 1 / -1;
  display: grid;
  gap: var(--gap-group);
}

.guide__panel[hidden] {
  display: none;
}

.guide__tools {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-group);
  align-items: baseline;
  justify-content: space-between;
}

.guide__orders {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-group);
}

.guide__orders button,
.guide__more {
  all: unset;
  cursor: pointer;
  font-size: 0.875rem;
  text-underline-offset: 0.25em;
}

.guide__orders button {
  color: var(--muted);
}

.guide__orders button[aria-pressed='true'] {
  color: inherit;
  text-decoration: underline;
}

.guide__orders button:hover,
.guide__more:hover {
  text-decoration: underline;
}

.guide__orders button:focus-visible,
.guide__more:focus-visible,
.guide__find:focus-visible,
.guide__item:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}

.guide__find {
  all: unset;
  box-sizing: border-box;
  inline-size: min(100%, 16rem);
  padding-block: 0.2rem;
  border-block-end: 1px solid color-mix(in oklab, currentColor 40%, transparent);
  font-size: 0.875rem;
  caret-color: currentColor;
}

.guide__find::placeholder {
  color: var(--muted);
}

.guide__find::selection {
  background: color-mix(in oklab, currentColor 30%, transparent);
}

.guide__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: var(--gap-block) var(--gap-group);
}

.guide__item {
  display: grid;
  gap: 0.4rem;
  align-content: start;
  font-size: 0.875rem;
  text-decoration: none;
}

.guide__thumb {
  display: block;
  inline-size: 100%;
  block-size: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: color-mix(in oklab, var(--fg) 12%, transparent);
}

.guide__title {
  text-wrap: balance;
}

.guide__item:hover .guide__title {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

/* Under a title, every figure is quiet: the title is the one bright line. */
.guide__meta,
.guide__meta :deep(.figure__value) {
  color: var(--muted);
}

.guide__project {
  margin-inline-end: var(--gap-group);
  font-family: var(--font-heading);
  font-variation-settings: 'CASL' var(--heading-casual);
}

/* Phones: the name and notes stack above the track. */
@media (width < 52rem) {
  .guide__row {
    grid-template-columns: minmax(0, 1fr);
  }

  .guide__note {
    max-width: none;
  }

  .guide__legend-in {
    inline-size: 25%;
    min-inline-size: 7rem;
  }
}
</style>
