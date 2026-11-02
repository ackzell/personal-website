<script setup lang="ts">
import type { VNode } from 'vue'
import type { Gem } from '~/composables/useCodeGem'

/**
 * What you write beside what you get: a scene's code, one file per tab, next
 * to the clip it renders, placed from markdown:
 *
 *   ::media-take{src="/media/moliniani/card.mp4" poster="/media/moliniani/card.webp" width="1920" height="1080" label="…"}
 *   ---
 *   cues:
 *     - { at: 0, file: scene.tsx, lines: [12] }
 *     - { at: 1.5, file: scene.tsx, lines: [13, 14] }
 *   ---
 *   ```tsx [scene.tsx]
 *   …
 *   ```
 *
 *   ```vue [Card.vue]
 *   …
 *   ```
 *
 *   Caption, in the page's own language.
 *   ::
 *
 * Each fenced block becomes a tab, named by its filename; whatever else the
 * take holds is its caption. `cues` mark which lines are running from which
 * second of the clip: the running line is lit (The Lit Rule), a cue in
 * another file brings its tab forward, and clicking a cued line takes the
 * clip there. The scrub bar moves the clip and the lit line together, with a
 * tick at each cue.
 *
 * The code is colored in the visitor's tlapalli gem (useCodeGem), which every
 * take can change; a change recolors every take, washing down the lines from
 * the top, and hovering a gem names it in a tooltip. Beside its code, a clip sits
 * halfway down, so a long file doesn't leave it hanging at the top.
 *
 * Below 56rem the clip comes first and stays pinned under the header while
 * the code scrolls beneath it, so the lit line and the picture are seen
 * together. Clips load only as they near the screen. Without JS every file
 * shows under its filename, and the clip has the browser's controls.
 */
interface Cue {
  /** Seconds into the clip. */
  at: number
  file?: string
  /** 1-based line numbers. */
  lines: number[]
}

const props = defineProps<{
  src: string
  webm?: string
  poster?: string
  /** What the clip shows, for anyone who can't see it. */
  label: string
  width: number | string
  height: number | string
  cues?: Cue[]
}>()

const { t } = useI18n()
const slots = useSlots()
const mounted = useMounted()
const reducedMotion = usePreferredReducedMotion()
const uid = useId()
const { gem, pick } = useCodeGem()

// The fenced blocks among the slot's children (ProsePre nodes carry `code`).
type Block = VNode & { props: { code: string, filename?: string | null, language?: string | null } }
const isBlock = (node: VNode): node is Block => typeof node.props?.code === 'string'
const blocks = () => (slots.default?.() ?? []).filter(isBlock)
// Everything else is the caption; bare whitespace between blocks isn't.
const caption = () => (slots.default?.() ?? []).filter((node) =>
  !isBlock(node) && !(typeof node.children === 'string' && !node.children.trim()))
const fileOf = (block: Block, i: number) => block.props.filename ?? block.props.language ?? `${i + 1}`

/* The gem */

// Shared by every take: a pick in one washes the new color down all of them.
// Counted, not watched off the gem itself, so the stored gem arriving on
// mount swaps in quietly instead of washing over a page just opened.
const picks = useState('code-gem-picks', () => 0)
const recoloring = ref(false)
// The wash (240ms, plus a 300ms cap on the stagger) has settled by then.
const { start: settle } = useTimeoutFn(() => { recoloring.value = false }, 600, { immediate: false })

watch(picks, () => {
  recoloring.value = true
  settle()
})

// The gem's tooltip, sized to the bar it names.
const GEM_TIP = '--tooltip-bg: var(--code-fg); font-size: 0.75rem; padding: var(--space-1) var(--space-2)'

function choose(next: Gem) {
  picks.value++
  pick(next)
}

const tab = ref(0)
const tabs = useTemplateRef<HTMLButtonElement[]>('tabs')

function onTabKeydown(event: KeyboardEvent, count: number) {
  const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
  if (!step) return
  event.preventDefault()
  tab.value = (tab.value + step + count) % count
  tabs.value?.[tab.value]?.focus()
}

/* The clip */

const video = useTemplateRef<HTMLVideoElement>('video')
const time = ref(0)
const duration = ref(0)
const playing = ref(false)
const visible = ref(false)
// null until the visitor chooses; then their choice wins over the default.
const wants = ref<boolean | null>(null)

// The server-rendered clip can load its metadata before hydration, and so
// before loadedmetadata is listened for: read what's already there.
onMounted(() => {
  if (video.value && video.value.readyState >= HTMLMediaElement.HAVE_METADATA) duration.value = video.value.duration
})

// Clips start with preload="none" and load as they come near the screen, so
// a page of takes doesn't fetch every clip up front.
let loading = false
useIntersectionObserver(video, ([entry]) => {
  const el = video.value
  if (!entry?.isIntersecting || !el || loading) return
  loading = true
  el.preload = 'metadata'
  if (el.readyState === HTMLMediaElement.HAVE_NOTHING) el.load()
}, { rootMargin: '50% 0px' })

useIntersectionObserver(video, ([entry]) => {
  visible.value = entry?.isIntersecting ?? false
}, { threshold: 0.5 })

const shouldPlay = computed(() => visible.value && (wants.value ?? reducedMotion.value !== 'reduce'))

watch(shouldPlay, (play) => {
  const el = video.value
  if (!el || scrubbing) return
  // play() rejects when the browser blocks it; the poster simply stays.
  if (play) el.play().catch(() => {})
  else el.pause()
})

function toggle() {
  wants.value = !playing.value
  if (wants.value) video.value?.play().catch(() => {})
  else video.value?.pause()
}

// timeupdate only fires a few times a second; follow the clip every frame
// while it plays, so the lit line changes on the beat.
const follow = useRafFn(() => {
  if (video.value) time.value = video.value.currentTime
}, { immediate: false })

watch(playing, (now) => (now ? follow.resume() : follow.pause()))

function seek(to: number) {
  time.value = to
  if (video.value) video.value.currentTime = to
}

// Dragging pauses the clip and puts it back the way it was on release.
let scrubbing = false
let resume = false

function scrubStart() {
  if (scrubbing) return
  scrubbing = true
  resume = playing.value
  video.value?.pause()
}

function scrubEnd() {
  if (!scrubbing) return
  scrubbing = false
  if (resume) video.value?.play().catch(() => {})
}

function scrub(event: Event) {
  seek(Number((event.target as HTMLInputElement).value))
}

const seconds = (s: number) => s.toFixed(1)
const progress = computed(() => (duration.value ? `${(time.value / duration.value) * 100}%` : '0%'))

/* Cues */

const sortedCues = computed(() => [...(props.cues ?? [])].sort((a, b) => a.at - b.at))
const cue = computed(() => sortedCues.value.findLast((c) => c.at <= time.value + 0.01))
const cueFile = (c: Cue) => c.file ?? fileOf(blocks()[0]!, 0)

// A cue in another file brings that file's tab forward. Only on a change of
// file, so a reader looking at another tab isn't pulled back every cue.
watch(cue, (now, before) => {
  if (!now?.file || now.file === before?.file) return
  const i = blocks().findIndex((block, j) => fileOf(block, j) === now.file)
  if (i !== -1) tab.value = i
})

// "25–28" for a run of lines, "24, 26" otherwise.
function lineRange(lines: number[]) {
  const sorted = [...lines].sort((a, b) => a - b)
  const run = sorted.every((n, i) => i === 0 || n === sorted[i - 1]! + 1)
  return run && sorted.length > 1 ? `${sorted[0]}–${sorted.at(-1)}` : sorted.join(', ')
}

// Said aloud only when the clip is still (scrubbed, paused, a line picked):
// while it plays, a line every second would drown everything else.
const announcement = ref('')
watch(cue, (now) => {
  if (!now || playing.value) return
  announcement.value = t('projects.media.take.running', { file: cueFile(now), lines: lineRange(now.lines) }, now.lines.length)
})

// The lines are Shiki's markup, not Vue's: mark them directly. Every line a
// cue names can be clicked to take the clip to it.
const panels = useTemplateRef<HTMLElement[]>('panels')

watch([cue, tab, panels], () => {
  for (const panel of panels.value ?? []) {
    const file = panel.dataset.file
    const lit = cue.value && cueFile(cue.value) === file ? cue.value.lines : []
    const cued = new Set(sortedCues.value.filter((c) => cueFile(c) === file).flatMap((c) => c.lines))
    for (const [i, line] of panel.querySelectorAll<HTMLElement>('.line').entries()) {
      const n = Number(line.getAttribute('line'))
      // Where the line falls in the wash.
      line.style.setProperty('--i', String(i))
      line.classList.toggle('take__cued', lit.includes(n))
      line.classList.toggle('take__cueable', cued.has(n))
    }
  }
}, { flush: 'post' })

function onPanelClick(event: MouseEvent, file: string) {
  const line = (event.target as Element).closest('.line')
  if (!line) return
  const n = Number(line.getAttribute('line'))
  const target = sortedCues.value.find((c) => cueFile(c) === file && c.lines.includes(n))
  if (target) seek(target.at)
}

// Code wider than its column fades at the edge it continues past, since
// overlay scrollbars don't show that there's more.
const overflowing = ref<Record<string, boolean>>({})

function measure() {
  for (const panel of panels.value ?? []) {
    const more = panel.scrollLeft + panel.clientWidth < panel.scrollWidth - 1
    overflowing.value = { ...overflowing.value, [panel.dataset.file!]: more }
  }
}

onMounted(measure)
watch(tab, measure, { flush: 'post' })
useEventListener('resize', useDebounceFn(measure, 100))

const source = (url: string) => (url.endsWith('.webm') ? 'video/webm' : 'video/mp4')
</script>

<template>
  <figure class="media take track-wide" :class="{ 'take--recoloring': recoloring }" :data-gem="gem">
    <div class="take__body">
      <div class="take__code">
        <div class="take__bar">
          <div v-if="mounted && blocks().length > 1" role="tablist" class="take__tabs"
            :aria-label="t('projects.media.take.files')">
            <button v-for="(block, i) in blocks()" :id="`${uid}-tab-${i}`" ref="tabs" :key="i" type="button" role="tab"
              class="take__tab" :aria-selected="tab === i" :aria-controls="`${uid}-panel-${i}`"
              :tabindex="tab === i ? 0 : -1" @click="tab = i" @keydown="onTabKeydown($event, blocks().length)">
              {{ fileOf(block, i) }}
            </button>
          </div>
          <span v-else-if="blocks().length === 1" class="take__file">{{ fileOf(blocks()[0]!, 0) }}</span>

          <div v-if="mounted" class="take__gems">
            <span :id="`${uid}-gems`" class="take__gems-label">
              {{ t('projects.media.take.gem') }}
              <span class="take__gem-slot">
                <Transition name="take-roll" mode="out-in">
                  <span :key="gem" class="take__gem-name">{{ gemName(gem) }}</span>
                </Transition>
              </span>
            </span>
            <div role="radiogroup" class="take__gem-row" :aria-labelledby="`${uid}-gems`">
              <label v-for="g in GEMS" :key="g" class="take__gem" :data-gem="g">
                <input type="radio" class="sr-only" :name="`${uid}-gem`" :value="g" :checked="gem === g"
                  @change="choose(g)">
                <span class="sr-only">{{ gemName(g) }}</span>
                <!-- The radio already says its name; this is for the pointer. -->
                <!-- Above, in its gem's own color, as the code would be. -->
                <SiteTooltip pointer-only pass-taps placement="top"
                  :tip-attrs="{ 'data-gem': g, style: GEM_TIP }">
                  <template #tip>{{ gemName(g) }}</template>
                </SiteTooltip>
              </label>
            </div>
          </div>
        </div>

        <template v-for="(block, i) in blocks()" :key="i">
          <!-- Without JS there are no tabs: each file is named over its code. -->
          <p v-if="!mounted && blocks().length > 1" class="take__file take__file--static">{{ fileOf(block, i) }}</p>
          <!-- The sheet holds vivid's gem background, so the panel's edge fade
               takes only the code with it. -->
          <div class="take__sheet" :hidden="mounted && tab !== i">
            <div :id="`${uid}-panel-${i}`" ref="panels" class="take__panel" :data-file="fileOf(block, i)"
              :data-more="overflowing[fileOf(block, i)] || undefined"
              :role="mounted && blocks().length > 1 ? 'tabpanel' : undefined"
              :aria-labelledby="mounted && blocks().length > 1 ? `${uid}-tab-${i}` : undefined"
              @scroll.passive="measure" @click="onPanelClick($event, fileOf(block, i))">
              <component :is="block" />
            </div>
          </div>
        </template>
      </div>

      <div class="take__screen" data-stick>
        <div class="media__frame">
          <video ref="video" :poster="poster" :width="width" :height="height" :aria-label="label"
            :controls="!mounted" muted loop playsinline preload="none" @play="playing = true"
            @pause="playing = false; time = video?.currentTime ?? time"
            @loadedmetadata="duration = video?.duration ?? 0" @seeked="time = video?.currentTime ?? time">
            <source v-if="webm" :src="webm" type="video/webm">
            <source :src="src" :type="source(src)">
          </video>
        </div>
        <div v-if="mounted" class="take__transport">
          <button type="button" class="take__play" data-press="key"
            :aria-label="playing ? t('projects.media.pause') : t('projects.media.play')" @click="toggle">
            <span :class="playing ? 'i-iconoir-pause-solid' : 'i-iconoir-play-solid'" aria-hidden="true" />
          </button>
          <div class="take__track">
            <input type="range" class="take__scrub" min="0" :max="duration || 0" step="0.01" :value="time"
              :style="{ '--progress': progress }" :aria-label="t('projects.media.take.scrub')"
              :aria-valuetext="`${seconds(time)}s`" @pointerdown="scrubStart" @pointerup="scrubEnd"
              @pointercancel="scrubEnd" @keydown="scrubStart" @keyup="scrubEnd" @input="scrub">
            <span v-for="(c, i) in duration ? sortedCues : []" :key="i" class="take__tick" aria-hidden="true"
              :style="{ insetInlineStart: `${(c.at / duration) * 100}%` }" />
          </div>
          <span class="take__time" aria-hidden="true">{{ seconds(time) }} / {{ seconds(duration) }}s</span>
        </div>
      </div>
    </div>
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
    <figcaption v-if="caption().length" class="media__caption take__caption">
      <component :is="node" v-for="(node, i) in caption()" :key="i" />
    </figcaption>
  </figure>
</template>

<style scoped>
/* Code first, the clip beside it, halfway down the code. */
.take__body {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  gap: var(--gap-group) var(--gap-block);
  align-items: start;
}

.take__screen {
  align-self: center;
}

/* Small screens: the clip first, pinned under the header (as HomeExperience
   pins its band), with the code scrolling beneath it. */
@media (width < 56rem) {
  .take__body {
    grid-template-columns: minmax(0, 1fr);
  }

  .take__screen {
    order: -1;
    position: sticky;
    /* Under the band, and the section row where a page has one (SiteSectionIndex). */
    top: calc(var(--header-height, 0px) - var(--header-tuck, 0px) + var(--section-index-height, 0px));
    z-index: 1;
    padding-block-end: var(--space-2);
    background: var(--bg);
  }
}

.take__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2) var(--space-4);
}

.take__tabs {
  display: flex;
  gap: var(--space-2);
}

/* File tabs are page chrome, in the page's colors; the gem only colors code. */
.take__tab,
.take__file {
  min-block-size: 1.875rem;
  padding: 0;
  font-family: var(--font-code);
  font-size: 0.75rem;
  color: var(--muted);
}

.take__tab {
  border: 0;
  background: linear-gradient(var(--accent), var(--accent)) bottom / 100% 0 no-repeat;
  cursor: pointer;
  transition: color 200ms var(--ease-out), background-size 200ms var(--ease-out);
}

.take__tab:hover,
.take__tab[aria-selected='true'],
.take__file {
  color: var(--fg);
}

/* The open file is marked by a field, the site's bar. */
.take__tab[aria-selected='true'] {
  background-size: 100% 0.25rem;
}

.take__file {
  display: inline-flex;
  align-items: center;
}

.take__file--static {
  margin-block-start: var(--space-3);
}

/* The gems: a field of each one's text color. The picked one is open (full
   height), the rest closed (half), as the flag band's fields are. */
.take__gems {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-3);
}

.take__gems-label {
  font-size: 0.75rem;
  color: var(--muted);
}

/* Room for the longest name ("Lapis Lazuli"), so a pick changing its length
   doesn't slide the gems out from under the pointer. */
.take__gem-slot {
  display: inline-block;
  min-inline-size: 12ch;
}

/* The name in its gem's own text color, the color of the code it names. */
.take__gem-name {
  display: inline-block;
  color: var(--code-fg);
}

/* A picked name rolls in from below as the last one leaves upward. */
.take-roll-enter-active {
  transition: transform 160ms var(--ease-out), opacity 160ms var(--ease-out);
}

.take-roll-leave-active {
  transition: transform 100ms var(--ease-in-out), opacity 100ms var(--ease-in-out);
}

.take-roll-enter-from {
  transform: translateY(0.5em);
  opacity: 0;
}

.take-roll-leave-to {
  transform: translateY(-0.5em);
  opacity: 0;
}

/* The wash: on a pick, each line takes the new gem a beat after the one
   above it, capped so a long file still settles quickly. */
.take--recoloring .take__panel :deep(.shiki span:not(.line)) {
  transition: color 240ms var(--ease-out);
  transition-delay: min(calc(var(--i, 0) * 14ms), 300ms);
}

.take__gem-row {
  display: flex;
}

.take__gem {
  position: relative;
  display: grid;
  place-items: center;
  inline-size: 1.875rem;
  block-size: 1.875rem;
  cursor: pointer;
}

.take__gem::before {
  content: '';
  inline-size: 1.125rem;
  block-size: 0.125rem;
  background: var(--code-fg);
  transition: block-size 200ms var(--ease-out);
}

.take__gem:hover::before {
  block-size: 0.1875rem;
}

.take__gem:has(:checked)::before {
  block-size: 0.25rem;
}

.take__gem:has(:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.take__caption > :deep(p + p) {
  margin-block-start: var(--space-2);
}

/* The code, straight on the stage. */
.take__sheet {
  margin-block-start: var(--space-2);
}

.take__panel {
  overflow-x: auto;
}

/* Except in vivid: the stage is too loud to read code on, so the code sits
   in its gem's own editor, the background following a pick with the wash
   (the one exception to The Stage Rule, DESIGN.md). On the sheet, not the
   panel, so the panel's edge fade leaves it solid. */
:root.vivid .take__sheet {
  padding-block: var(--space-3);
  background-color: var(--code-bg);
  transition: background-color 240ms var(--ease-out);
}

.take__panel[data-more] {
  mask-image: linear-gradient(to left, transparent, #000 3rem);
}

.take__panel :deep(pre) {
  overflow: visible;
  font-size: 0.8125rem;
  line-height: 1.7;
}

.take__panel :deep(pre code) {
  display: block;
  min-inline-size: max-content;
}

.take__panel :deep(.line) {
  position: relative;
  padding-inline: var(--space-3) var(--space-4);
  transition: background-color 200ms var(--ease-out);
}

.take__panel :deep(.line)::before {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline-start: 2px;
  inline-size: 3px;
  transition: background-color 200ms var(--ease-out);
}

.take__panel :deep(.line.take__cueable) {
  cursor: pointer;
}

/* A line you could take the clip to previews without light, as the flag
   band's fields do: a faint marker. */
.take__panel :deep(.line.take__cueable:hover)::before {
  background-color: color-mix(in srgb, var(--accent) 35%, transparent);
}

/* The line the clip is on is lit (The Lit Rule): a bar of the accent, and in
   dark and vivid's dark panels a neon one, with --glow-near since the panel
   clips. */
.take__panel :deep(.line.take__cued) {
  background-color: color-mix(in srgb, var(--accent) 8%, transparent);
}

.take__panel :deep(.line.take__cued)::before {
  background-color: var(--accent);
}

:root:is(.dark, .vivid) .take__panel :deep(.line.take__cued)::before {
  background-color: var(--hot);
  box-shadow: var(--glow-near);
  mix-blend-mode: plus-lighter;
}

.take__transport {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-block-start: var(--space-2);
}

.take__play {
  display: grid;
  flex: none;
  place-items: center;
  inline-size: 1.875rem;
  block-size: 1.875rem;
  padding: 0;
  border: 0;
  background: none;
  color: var(--fg);
  cursor: pointer;
}

.take__play:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.take__track {
  position: relative;
  flex: 1;
  display: flex;
}

/* The scrub bar is a field too: flat, square, filled with the accent up to
   where the clip is, with a bar for a thumb. */
.take__scrub {
  flex: 1;
  block-size: 1.875rem;
  margin: 0;
  background: transparent;
  cursor: pointer;
  appearance: none;
}

.take__scrub::-webkit-slider-runnable-track {
  block-size: 0.25rem;
  background: linear-gradient(var(--accent), var(--accent)) 0 / var(--progress) 100% no-repeat, var(--line);
}

.take__scrub::-moz-range-track {
  block-size: 0.25rem;
  background: linear-gradient(var(--accent), var(--accent)) 0 / var(--progress) 100% no-repeat, var(--line);
}

.take__scrub::-webkit-slider-thumb {
  inline-size: 0.25rem;
  block-size: 1rem;
  margin-block-start: -0.375rem;
  border: 0;
  border-radius: 0;
  background: var(--accent);
  appearance: none;
}

.take__scrub::-moz-range-thumb {
  inline-size: 0.25rem;
  block-size: 1rem;
  border: 0;
  border-radius: 0;
  background: var(--accent);
}

.take__scrub:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Where each cue starts, above the bar. */
.take__tick {
  position: absolute;
  inset-block-start: calc(50% - 0.625rem);
  inline-size: 2px;
  block-size: 0.25rem;
  background: var(--muted);
  translate: -50% 0;
  pointer-events: none;
}

.take__time {
  flex: none;
  font-family: var(--font-code);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}

@media (prefers-reduced-motion: reduce) {
  .take__tab,
  .take__gem::before,
  .take-roll-enter-active,
  .take-roll-leave-active,
  .take--recoloring .take__panel :deep(.shiki span:not(.line)),
  .take__panel :deep(.line),
  .take__panel :deep(.line)::before {
    transition: none;
  }
}
</style>
