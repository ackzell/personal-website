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
 * On a touch screen a finger scrubs along a strip. A tap, a click or Enter
 * lifts the release into a sheet (GuideSheet), docked at the side on a wide
 * screen, rather than leaving the site; a click meant for a new tab still
 * goes to it.
 * Come from a month on the media hub's timeline (?month=2023-04), that
 * month's releases are lit across every strip and the rest step back, each
 * row's line saying how many it holds; one release alone opens in the sheet.
 * The first press or key puts the guide back as it was.
 * The items themselves live on YouTube and mytypeof.dev.
 */
import type { ListItem } from './GuideList.vue'

const props = defineProps<{ series: GuideSeries[] }>()

const { t, n } = useI18n()

const { formatDate, figure, figures } = useGuideFigures()
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

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

// The month to light, from the hub's timeline, as 2023-04.
const route = useRoute()
const month = route.query.month
const lit = ref(typeof month === 'string' && /^\d{4}-\d{2}$/.test(month) ? month : null)
const isLit = (release: GuideRelease) => !!lit.value && release.published.startsWith(lit.value)
const formatLongMonth = useMonthFormat('long')

const podcast = computed(() => props.series.some((row) => row.kind === 'podcast'))
const hasBars = computed(() => props.series.some((row) => row.releases.some((release) => release.duration)))
// Some of these are left empty on purpose; the swatches already explain the marks.
const legendNote = computed(() => t(podcast.value ? 'media.guide.legend.episodes' : hasBars.value ? 'media.guide.legend.bars' : 'media.guide.legend.videos'))
const hasViews = computed(() => props.series.some((row) => row.kind === 'playlist' && row.releases.some((release) => release.views !== undefined)))

// The line under a strip at rest: its span, or, while a month is lit, how
// much of the row is in it.
function idleOf(row: GuideSeries, releases: GuideRelease[], from: string, to: string) {
  const count = lit.value ? releases.filter(isLit).length : 0
  if (!count) return `${formatDate(from)} → ${formatDate(to)}`
  const name = formatLongMonth(lit.value!)
  return `${name} · ${t(row.kind === 'podcast' ? 'media.guide.episodes' : 'media.guide.videos', count)}`
}

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
  const totals: GuideFigure[] = [
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
        release.duration ? formatClock(release.duration) : '',
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
    idle: idleOf(row, releases, from, to),
    all: releases.map((release, index) => ({ release, number: index + 1, figures: figures(release, row.kind === 'playlist' ? index + 1 : undefined) })),
  }
}))

// Which cell is being read out in each row: the line under the strip, which
// also serves the keyboard.
type Cell = { release: GuideRelease, figures: GuideFigure[] }
const reading = ref<Record<string, { title: string, figures: GuideFigure[], id: string }>>({})
function read(row: string, cell: Cell) {
  reading.value[row] = { title: cell.release.title, figures: cell.figures, id: cell.release.id }
}

// The cell under the pointer, or the nearest one when it's in the gaps
// between them, so reading along a strip never drops out. A touch keeps
// reporting to the cell it started on, so look at what's under it instead.
function cellAt(event: PointerEvent, cells: Cell[]) {
  const strip = event.currentTarget as HTMLElement
  let target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-release]')
  if (!target || !strip.contains(target)) {
    let best = Infinity
    for (const element of strip.querySelectorAll<HTMLElement>('[data-release]')) {
      const box = element.getBoundingClientRect()
      const dx = Math.max(box.left - event.clientX, 0, event.clientX - box.right)
      const dy = Math.max(box.top - event.clientY, 0, event.clientY - box.bottom)
      if (dx * dx + dy * dy < best) {
        best = dx * dx + dy * dy
        target = element
      }
    }
  }
  return cells.find(({ release }) => release.id === target?.dataset.release)
}

/*
 * The card that shows what's being read (useGuideCard). A mouse carries it
 * just above the pointer, still only, since the line under the strip says
 * the rest. A finger hides that line, so above the strip the card says it
 * all, and it steps from cell to cell under the finger.
 */
type Row = GuideSeries
const card = useTemplateRef<HTMLElement>('card')
const preview = ref<{ row: Row, cell: Cell, touch: boolean } | null>(null)
const { placed, aim, still, wanted, want } = useGuideCard(card, reducedMotion)

// The host's own player, held to one episode by the name of its page there,
// so a play here counts as a download.
const playerUrl = (episode: string) => `https://mytypeof.dev/embed/player?image-display=true&title-display=false&type=podcast&podcast-slug=my-typeof-radio&episode-slug=${episode}`
// The stills come from one host; the handshake is done before the first is asked for.
useHead(() => ({
  link: props.series.some((row) => row.kind === 'playlist') ? [{ rel: 'preconnect', href: 'https://i.ytimg.com' }] : [],
}))

function show(row: Row, cell: Cell, touch: boolean) {
  read(row.id, cell)
  if (row.kind === 'playlist') want(cell.release.id)
  // A mouse reads a podcast's bars from the line under the strip.
  else if (!touch) return
  preview.value = { row, cell, touch }
}

let hideTimer: ReturnType<typeof setTimeout> | undefined
function hide(row?: string) {
  clearTimeout(hideTimer)
  if (row) delete reading.value[row]
  preview.value = null
  placed.value = false
}

function hover(event: PointerEvent, row: Row, cells: Cell[]) {
  if (event.pointerType !== 'mouse') return
  const cell = cellAt(event, cells)
  if (!cell) return
  // A slight tick for each release the mouse comes to (a finger's scrub has its own).
  if (cell.release.id !== reading.value[row.id]?.id) sound('point')
  show(row, cell, false)
  if (preview.value) aim(event.clientX, event.clientY - 8, event.clientY + 20, false)
}

/*
 * A finger on a strip. Held, or dragged along it, it scrubs: the cell under
 * it is read out and the card steps along above. Let go after a scrub, the
 * card stays a moment to be read, and tapped it opens that release. A tap
 * that didn't scrub opens the release it landed on. Dragged up or down, it
 * was a scroll all along, and the browser takes it over.
 */
let gesture: { row: string, start: string, scrubbed: boolean, timer?: ReturnType<typeof setTimeout> } | undefined

function stepTo(strip: HTMLElement, row: Row, cell: Cell) {
  show(row, cell, true)
  const { top, bottom } = strip.getBoundingClientRect()
  const box = strip.querySelector(`[data-release="${CSS.escape(cell.release.id)}"]`)!.getBoundingClientRect()
  aim(box.left + box.width / 2, top, bottom, true)
}

function press(event: PointerEvent, row: Row, cells: Cell[]) {
  if (event.pointerType === 'mouse') return
  const cell = cellAt(event, cells)
  if (!cell) return
  clearTimeout(hideTimer)
  clearTimeout(gesture?.timer)
  // The cell fills in at once, under the finger.
  read(row.id, cell)
  // The sheet's still is on its way while the finger is still down.
  if (row.kind === 'playlist') new Image().src = youtubeStill(cell.release.id, 'hqdefault')
  // A beat before the card, in case this is the start of a scroll.
  const strip = event.currentTarget as HTMLElement
  const timer = setTimeout(() => stepTo(strip, row, cell), 90)
  gesture = { row: row.id, start: cell.release.id, scrubbed: false, timer }
}

// Within the cell it started on, it's still a press.
function scrub(event: PointerEvent, row: Row, cells: Cell[]) {
  if (event.pointerType === 'mouse' || gesture?.row !== row.id) return
  const cell = cellAt(event, cells)
  if (!cell || cell.release.id === reading.value[row.id]?.id) return
  gesture.scrubbed = true
  clearTimeout(gesture.timer)
  // Heard at its length, as its bar is drawn.
  haptic('tick', cell.release.duration && cell.release.duration / longest.value)
  stepTo(event.currentTarget as HTMLElement, row, cell)
}

function lift(event: PointerEvent) {
  if (event.pointerType === 'mouse' || !gesture) return
  clearTimeout(gesture.timer)
  hideTimer = setTimeout(hide, 1800)
}

// Scrolled, the strip moves out from under the card.
useEventListener('scroll', () => {
  if (preview.value) hide()
}, { passive: true, capture: true })

function abandon(row: string) {
  clearTimeout(gesture?.timer)
  gesture = undefined
  hide(row)
}

// What a tap on a touch screen lifts into a sheet.
interface Lifted { video?: string, episode?: string, title: string, from: string, figures: GuideFigure[], url: string }
const sheet = shallowRef<Lifted | null>(null)
function lay(row: Row, cell: Cell) {
  hide()
  sheet.value = {
    video: row.kind === 'playlist' ? cell.release.id : undefined,
    episode: row.kind === 'podcast' ? cell.release.url.split('/episode/')[1] : undefined,
    title: cell.release.title,
    from: row.title,
    figures: cell.figures,
    url: cell.release.url,
  }
}

// Whatever was last pressed with: a long press is told from a right click by it.
let lastPointer = 'mouse'
useEventListener('pointerdown', (event: PointerEvent) => {
  lastPointer = event.pointerType
}, { passive: true, capture: true })

// A click with a modifier, or the middle button, is asked for a tab of its
// own, and the link gives it one.
const elsewhere = (event: MouseEvent) => event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey

// A tap, a click or the keyboard opens the sheet, unless the tap ended a
// scrub (then the card is the way in).
function tap(event: MouseEvent, row: Row, cell: Cell) {
  if (elsewhere(event)) return
  event.preventDefault()
  const scrubbed = gesture?.scrubbed
  gesture = undefined
  if (!scrubbed) lay(row, cell)
}

// One from a row's list, the same way.
function pick(event: MouseEvent, row: Row, item: ListItem) {
  if (elsewhere(event)) return
  event.preventDefault()
  lay(row, item)
}

// A month lit from the hub: one release alone is lifted straight into the
// sheet. Whatever is pressed or typed next, the guide is back to itself.
onMounted(() => {
  if (!lit.value) return
  const found = rows.value.flatMap(({ row, cells }) => cells.filter((cell) => isLit(cell.release)).map((cell) => ({ row, cell })))
  // A video in two playlists is still one release.
  if (new Set(found.map(({ cell }) => cell.release.id)).size === 1) lay(found[0]!.row, found[0]!.cell)
  window.addEventListener('pointerdown', unlight, true)
  window.addEventListener('keydown', unlight, true)
})
function unlight() {
  lit.value = null
  stopUnlight()
}
function stopUnlight() {
  window.removeEventListener('pointerdown', unlight, true)
  window.removeEventListener('keydown', unlight, true)
}
onBeforeUnmount(stopUnlight)

const open = ref(new Set<string>())
// Phones, where the name and the strip stack (see the styles).
const narrow = useMediaQuery('(width < 52rem)')
// The row whose list is up in a sheet, on a phone.
const listing = shallowRef<{ row: Row, items: ListItem[], big: boolean } | null>(null)

// On a phone the list rises in a sheet of its own, with its own scroll. On
// a wider screen it opens under the row, closing any other (one is browsed
// at a time; the strips do the comparing), and that brings the row to the top
// of the page: the list is what's wanted now, and it's longer than the
// screen.
async function toggle(row: Row, items: ListItem[], big: boolean, event: MouseEvent) {
  if (narrow.value) {
    listing.value = { row, items, big }
    return
  }
  const section = (event.currentTarget as HTMLElement).closest<HTMLElement>('.guide__row')
  if (open.value.has(row.id)) {
    if (section) await collapse(section)
    open.value = new Set()
    return
  }
  // Opening another while one is open swaps them at once: a list folding
  // away above would move the row out from under its scroll.
  open.value = new Set([row.id])
  await nextTick()
  section?.scrollIntoView({ block: 'start', behavior: reducedMotion.value ? 'auto' : 'smooth' })
}

// Closing folds the list up into its row (foldAway), back to where it opened.
const collapsing = new Set<HTMLElement>()
async function collapse(section: HTMLElement) {
  const panel = section.querySelector<HTMLElement>('.guide__panel')
  if (!panel || reducedMotion.value || collapsing.has(panel)) return
  collapsing.add(panel)
  await foldAway(section, panel, () => {
    open.value = new Set()
  })
  collapsing.delete(panel)
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

// Entrance: each strip draws itself in (useGuideReveal).
const root = useTemplateRef<HTMLElement>('root')
const { linked, waiting, order, fit } = useGuideReveal(root, reducedMotion)
</script>

<template>
  <div ref="root" class="guide">
    <!-- A key to the marks, pinned top right under the header while the guide is on screen. The marks are drawn
         with the strip's own cell styles, so key and strip can't drift. -->
    <aside class="guide__legend" :aria-label="t('media.guide.legend.label')">
      <p class="guide__legend-in" :class="{ 'guide__legend-in--away': listed.size }" m="0" text="xs muted">
        <SiteMarkLayer clipped />
        <template v-if="hasBars">
          <span class="guide__key">
            <span class="guide__swatch" :class="podcast ? 'guide__swatch--bars' : 'guide__swatch--runs'"
              aria-hidden="true"><i /><i /></span>
            {{ t(podcast ? 'media.guide.legend.length' : 'media.guide.legend.videoLength') }}
          </span>
          <span class="guide__key">
            <span class="guide__swatch guide__swatch--ramp" aria-hidden="true" />
            {{ t(hasViews ? 'media.guide.legend.views' : 'media.guide.legend.downloads') }}
          </span>
        </template>
        <span v-if="legendNote" class="guide__key">{{ legendNote }}</span>
      </p>
    </aside>
    <div role="list" :aria-label="t('media.guide.label')">
      <section v-for="({ row, cells, width, totals, idle, bars, big, all }, index) in rows" :id="`row-${row.id}`" :key="row.id"
        class="guide__row" :class="{ 'guide__row--waiting': waiting.has(row.id), 'guide__row--linked': linked.has(row.id) }"
        :style="{ '--row': order[row.id] ?? index, '--enter-base': row.id in order ? '0ms' : undefined, '--fit': fit[row.id] }"
        :data-row="row.id" role="listitem">
        <div class="guide__who">
          <h2 m="0" class="guide__name">
            <button type="button" :aria-expanded="open.has(row.id) || listing?.row.id === row.id"
              :aria-controls="`guide-${row.id}`" :aria-haspopup="narrow ? 'dialog' : undefined"
              @click="toggle(row, all, big, $event)">
              {{ row.title }}
            </button>
          </h2>
          <p class="guide__stats" m="0" text="sm">
            <GuideFigures :figures="totals" />
          </p>
          <p v-if="row.note" class="guide__note" m="0" text="sm muted">{{ row.note }}</p>
        </div>

        <div class="guide__right">
          <div class="guide__strip" @pointerdown="press($event, row, cells)"
            @pointermove="hover($event, row, cells); scrub($event, row, cells)" @pointerup="lift"
            @pointercancel="abandon(row.id)" @pointerleave="$event.pointerType === 'mouse' && hide(row.id)"
            @contextmenu="lastPointer !== 'mouse' && $event.preventDefault()"
            :class="{ 'guide__strip--bars': bars, 'guide__strip--wrap': row.kind === 'playlist', 'guide__strip--lit': lit }"
            :style="{ '--cells': cells.length, 'inline-size': width }" :aria-hidden="big || undefined">
            <a v-for="(cell, i) in cells" :key="cell.release.id" class="guide__cell" data-press="sink"
              :class="{ 'guide__cell--on': reading[row.id]?.id === cell.release.id, 'guide__cell--lit': isLit(cell.release) }" :href="cell.release.url"
              :aria-label="cell.label" :tabindex="big ? -1 : undefined"
              :style="{ height: cell.height, '--min': cell.minutes, '--shade': cell.shade, '--i': i }"
              :data-release="cell.release.id" @focus="read(row.id, cell); sound('point')" @blur="delete reading[row.id]"
              @click="tap($event, row, cell)" />
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
          <GuideList v-if="open.has(row.id)" :row="row" :items="all" :big="big"
            @pick="(event, item) => pick(event, row, item)" />
        </div>
      </section>
    </div>

    <Teleport to="body">
      <component :is="preview?.touch ? 'button' : 'span'" v-if="preview" ref="card" class="guide__card"
        :type="preview.touch ? 'button' : undefined" :data-touch="preview.touch || undefined"
        :data-placed="placed || undefined" aria-hidden="true"
        tabindex="-1" @click="lay(preview.row, preview.cell)">
        <span v-if="preview.row.kind === 'playlist'" class="guide__still"
          :class="{ 'guide__still--stale': still !== wanted }">
          <img v-if="still" :src="still" alt="" width="320" height="180">
        </span>
        <span v-if="preview.touch" class="guide__card-text" text="sm">
          <span class="guide__card-title">{{ preview.cell.release.title }}</span>
          <GuideFigures :figures="preview.cell.figures" />
        </span>
      </component>
    </Teleport>

    <!-- A release, tapped: a video plays right here, with its way out to YouTube under it; an episode plays in the player
         of mytypeof.dev (which names it, so the title here steps aside), with its way out there. -->
    <GuideSheet v-model:item="sheet" :label="sheet?.title" dock>
      <template #head="{ item }">
        <p m="0" text="sm muted">{{ item.from }}</p>
        <h2 v-if="!item.episode" class="guide__sheet-title" m="0">{{ item.title }}</h2>
        <p m="0" text="sm">
          <GuideFigures :figures="item.figures" />
        </p>
      </template>
      <template #default="{ item }">
        <MediaVideo v-if="item.video" :key="item.video" class="guide__sheet-video"
          :src="youtubeWatch(item.video)" :title="item.title"
          :poster="youtubeStill(item.video, 'hqdefault')" />
        <iframe v-else-if="item.episode" :key="item.episode" class="guide__sheet-player"
          :src="playerUrl(item.episode)" :title="item.title" allow="autoplay; encrypted-media" loading="lazy" />
        <p v-if="!item.video" m="0">
          <a :href="item.url" class="guide__sheet-out">{{ t('media.guide.openPodcast') }}<span
              class="i-iconoir-arrow-up-right" aria-hidden="true" /></a>
        </p>
      </template>
    </GuideSheet>

    <!-- A row's list, on a phone. Held tall only when it can be searched (so
         it doesn't jump as it narrows); a short season fits what it holds. -->
    <GuideSheet v-model:item="listing" :label="listing?.row.title" :tall="listing?.big">
      <template #head="{ item }">
        <h2 class="guide__sheet-title" m="0">{{ item.row.title }}</h2>
        <p m="0" text="sm">
          <GuideFigures :figures="rows.find(({ row }) => row.id === item.row.id)?.totals ?? []" />
        </p>
        <p v-if="item.row.note" m="0" text="sm muted">{{ item.row.note }}</p>
      </template>
      <template #default="{ item }">
        <GuideList :key="item.row.id" :row="item.row" :items="item.items" :big="item.big" pinned
          @pick="(event, picked) => pick(event, item.row, picked)" />
      </template>
    </GuideSheet>
  </div>
</template>

<style scoped>
.guide {
  --label: 17rem;
}

/* Zero-height sticky anchor: the key rides right, centered in what the header
   leaves of the screen, while the guide passes through the middle, and
   scrolls away with it. Sticking the anchor itself there (rather than under
   the header) keeps the key centered before the guide's top reaches the
   header too. The key centers on it as a flex item, which overflows the
   zero height evenly both ways: no translate, which would pull the key's
   copy of the mark (SiteMarkLayer) out of line with the one behind. */
.guide__legend {
  position: sticky;
  inset-block-start: calc(var(--header-height, 0px) + (100svh - var(--header-height, 0px)) / 2);
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  block-size: 0;
}

/* Solid, so the strips don't read through it; its copy of the mark carries
   the stage across it. */
.guide__legend-in {
  position: relative;
  isolation: isolate;
  flex: none;
  margin-inline-end: -2rem;
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

/* all: unset clears the site's press (main.css) with it, so it's put back: the name dims while pressed. */
.guide__name button {
  transition: filter 0.25s var(--ease-out);
}

.guide__name button:active {
  filter: opacity(0.55);
  transition-duration: 0s;
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
   are known) so the area of the block is how much there is. Bars stand in rows of
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

/* A month lit from the hub: its releases fill in and the rest step back. */
.guide__strip--lit .guide__cell {
  background: color-mix(in oklab, var(--fg) 16%, transparent);
}

.guide__strip--lit .guide__cell--lit {
  background: var(--fg);
}

/* The cell being read fills in, under a mouse, a finger or the keyboard. */
.guide__strip .guide__cell--on,
.guide__strip .guide__cell:focus-visible {
  background: var(--fg);
}

/* Sideways along a strip is the finger's to read with; up and down still
   scrolls the page. A finger held on a cell scrubs, so no link preview or
   selection comes up under it. */
.guide__strip {
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}


/*
 * Entrance: a row's name develops and lifts, landing on the work section's
 * spring (vt-develop, vt-lift: main.css), then its strip draws itself in
 * left to right, each mark springing out along what it measures, a touch
 * past and back (--ease-pop): an episode's bar up to its length, a reel's
 * cell across to its length, a frame settling into place.
 * The sweep takes longer for a longer row, up to a cap. Rows come one after
 * another (--row), and the reading line under the strip arrives last.
 * Backwards fill only, so nothing lingers on the marks once they're in.
 */
@media (prefers-reduced-motion: no-preference) {
  .guide__row {
    --enter: calc(var(--enter-base, 300ms) + min(var(--row, 0), 5) * 90ms);
  }

  .guide__who {
    --lift-from: 0 var(--space-6);
    animation:
      400ms var(--ease-out) var(--enter) backwards vt-develop,
      var(--arrive-duration) var(--ease-arrive) var(--enter) backwards vt-lift;
  }

  .guide__cell {
    --sweep: calc(var(--i, 0) / max(var(--cells, 1) - 1, 1) * min(var(--cells, 1) * 16ms, 560ms));
    animation: var(--pop-duration) var(--ease-pop) calc(var(--enter) + 80ms + var(--sweep)) backwards guide-settle;
  }

  .guide__strip--bars .guide__cell {
    transform-origin: bottom;
    animation-name: guide-grow-up;
  }

  .guide__strip--wrap.guide__strip--bars .guide__cell {
    transform-origin: left;
    animation-name: guide-grow-across;
  }

  .guide__read {
    animation: 400ms var(--ease-out) calc(var(--enter) + 420ms) backwards guide-fade-in;
  }

  .guide__legend-in {
    animation: 600ms var(--ease-out) 900ms backwards guide-fade-in;
  }

  /*
   * Scrolled to: the same marks, drawn by the scroll instead of the clock.
   * Each row is its own timeline, and the ranges are lengths of scroll from
   * when the row's top comes up past the bottom of the screen, so a row that
   * grows (its list opened) doesn't undraw. The name rises first; the strip
   * sweeps in as the row's top travels from about 78% to 42% of the screen,
   * up where the eye is rather than at the bottom edge; the reading line
   * follows. Near the page's end it all runs shorter (--fit), so the last
   * rows finish before the scroll does. No springs here: tied to the scroll,
   * an overshoot would only follow the finger back and forth.
   */
  .guide__row--linked {
    view-timeline: --guide-row block;
  }

  .guide__row--linked :is(.guide__who, .guide__cell, .guide__read) {
    animation-duration: auto;
    animation-delay: 0s;
    animation-fill-mode: both;
    animation-timeline: --guide-row;
    animation-timing-function: var(--ease-out);
  }

  .guide__row--linked .guide__who {
    animation-name: vt-rise;
    animation-range: cover calc(20svh * var(--fit, 1)) cover calc(38svh * var(--fit, 1));
  }

  .guide__row--linked .guide__cell {
    --p: calc(var(--i, 0) / max(var(--cells, 1) - 1, 1));
    animation-range: cover calc((22svh + var(--p) * 24svh) * var(--fit, 1)) cover calc((34svh + var(--p) * 24svh) * var(--fit, 1));
  }

  .guide__row--linked .guide__read {
    animation-range: cover calc(56svh * var(--fit, 1)) cover calc(68svh * var(--fit, 1));
  }

  /* Out of sight until scrolled to; the animations start when this goes. */
  .guide__row--waiting :is(.guide__who, .guide__cell, .guide__read) {
    animation: none;
    opacity: 0;
  }
}

@keyframes guide-fade-in {
  from {
    opacity: 0;
  }
}

@keyframes guide-settle {
  from {
    opacity: 0;
    scale: 0.6;
  }
}

@keyframes guide-grow-up {
  from {
    opacity: 0;
    scale: 1 0;
  }
}

@keyframes guide-grow-across {
  from {
    opacity: 0;
    scale: 0 1;
  }
}

/* The card over the strip: the inverse of the stage, like SiteTooltip, so
   it reads as lifted off the page. It fades and pops in a beat after it's
   placed, and follows from there on springs (script); the box holds its
   shape while the first still loads. */
.guide__card {
  all: unset;
  position: fixed;
  inset-block-start: 0;
  inset-inline-start: 0;
  z-index: 100;
  box-sizing: border-box;
  display: grid;
  gap: var(--space-1);
  inline-size: 14rem;
  max-inline-size: calc(100vw - 24px);
  padding: var(--space-1);
  color: var(--bg);
  background: var(--fg);
  pointer-events: none;
  opacity: 0;
  scale: 0.94;
  transform-origin: bottom center;
}

.guide__card[data-placed] {
  opacity: 1;
  scale: 1;
}

/* Let go of, it's the way into the release. */
.guide__card[data-touch] {
  inline-size: 16rem;
  pointer-events: auto;
  cursor: pointer;
}

@media (prefers-reduced-motion: no-preference) {
  .guide__card[data-placed] {
    transition:
      opacity 200ms var(--ease-out),
      scale var(--pop-duration) var(--ease-pop);
  }
}

.guide__still {
  display: block;
  aspect-ratio: 16 / 9;
  background: color-mix(in oklab, var(--bg) 25%, transparent);
}

.guide__still img {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  transition: opacity 120ms var(--ease-out);
}

/* The last still holds while the next loads, a step back so it's plain
   it's on its way. */
.guide__still--stale img {
  opacity: 0.55;
}

.guide__card-text {
  display: grid;
  gap: 0.15rem;
  padding: 0.15rem var(--space-1) var(--space-1);
  line-height: 1.3;
}

.guide__card-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* The figures take the card's colors, not the page's. */
.guide__card :deep(.figure__value) {
  color: inherit;
}

.guide__card :deep(.figure__unit) {
  color: inherit;
  opacity: 0.7;
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

/* What's in a sheet. */
.guide__sheet-title {
  font-family: var(--font-heading);
  font-variation-settings: 'CASL' var(--heading-casual);
  font-size: 1.25rem;
  line-height: 1.2;
  text-wrap: balance;
}

.guide__sheet-video {
  margin: 0;
}

.guide__sheet-player {
  box-sizing: content-box;
  display: block;
  /* Its navy is not the section's: a mat, a step from the panel toward it,
     sits between the two. */
  --mat: 0.75rem;
  width: calc(100% - 2 * var(--mat));
  /* The player's own, which it keeps at any width (art, title, controls),
     and room for two more lines: a long title runs to three. */
  --player: calc(274px + 2.5rem);
  height: var(--player);
  padding: var(--mat);
  border: 0;
  background: color-mix(in srgb, var(--fg) 9%, var(--bg));
}

/* Narrower than the player, as off the dock, it scrolls sideways: room for
   the bar. */
@media (width < 64rem) {
  .guide__sheet-player {
    height: calc(var(--player) + 18px);
  }
}

.guide__sheet-out {
  display: inline-flex;
  gap: 0.4ch;
  align-items: center;
}

.guide__sheet-out:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
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
