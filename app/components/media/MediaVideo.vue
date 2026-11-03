<script setup lang="ts">
/**
 * A narrated video in a case study (an essay, a talk), placed from markdown:
 *
 *   ::media-video{src="https://youtu.be/…" title="…" poster="/media/tlapalli/essay.jpg"}
 *   Caption, in the page's own language.
 *   ::
 *
 * It opens as the video's thumbnail and only loads YouTube's player when
 * asked: the player weighs more than the rest of the page, and sets its
 * cookies on everyone who merely scrolls past. Played, it's the nocookie
 * player with none of YouTube's own chrome: a cover over it takes every
 * press (so the player never sees the pointer and never shows its bar), and
 * the thumbnail returns whenever it isn't playing, over YouTube's paused and
 * end screens. Play, pause and a seek bar are the controls, sent to the
 * player through its postMessage API. Without JS the thumbnail is a plain link to
 * the video. `poster` keeps the thumbnail local; without it, YouTube's own
 * is used.
 *
 * It also fills the screen, from a control beside play: the frame itself goes
 * fullscreen (not YouTube's player, which is told not to), so the cover and
 * its controls come along. Where the browser can't put an element fullscreen
 * (an iPhone), the frame fills the window instead, over the page, until it's
 * asked back or Escape is pressed.
 *
 * The seek bar comes once the player has said how long the video runs. It
 * shows what's played and what's loaded, from the times the player reports a
 * few times a second, carried on between reports so it runs smoothly. Dragged,
 * it shows frames already loaded as it goes, and loads where it's let go.
 */
const props = defineProps<{
  /** Any YouTube link: youtu.be/…, watch?v=…, or /embed/…. */
  src: string
  /** The video's own title: the player's accessible name. */
  title: string
  poster?: string
  wide?: boolean
  /** Laid out but not shown (a MediaPalette entry that isn't picked): it pauses. */
  inactive?: boolean
}>()

const { t } = useI18n()
const slots = useSlots()
const mounted = useMounted()

const PLAYER = 'https://www.youtube-nocookie.com'

const id = computed(() => {
  const url = new URL(props.src)
  return url.searchParams.get('v') ?? url.pathname.split('/').pop()!
})
const watchUrl = computed(() => youtubeWatch(id.value))
const thumbnail = computed(() => props.poster ?? youtubeStill(id.value, 'maxresdefault'))

// idle: only the thumbnail, no player yet. loading: the player is on its way
// (or resuming) under the thumbnail. playing: the thumbnail is off it.
// paused / ended: the thumbnail is back over YouTube's own screens.
const state = ref<'idle' | 'loading' | 'playing' | 'paused' | 'ended'>('idle')
const embed = ref<string>()
const frame = useTemplateRef<HTMLIFrameElement>('frame')
const screen = useTemplateRef<HTMLElement>('screen')

// Fullscreen where the browser has it; otherwise the window, filled.
const fullscreen = useFullscreen(screen)
const filled = ref(false)
const large = computed(() => fullscreen.isFullscreen.value || filled.value)

function enlarge() {
  if (fullscreen.isSupported.value) fullscreen.toggle()
  else filled.value = !filled.value
}

// Filled, Escape is the frame's alone: it doesn't also close a sheet it's in.
useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (!filled.value || event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  filled.value = false
}, { capture: true })

function command(func: string, args: unknown[] = []) {
  frame.value?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), PLAYER)
}

// Ask the player to report its state; it answers on window 'message'.
function listen() {
  frame.value?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: id.value, channel: 'widget' }), PLAYER)
}

// In seconds. `current` is where the player last said it was (or where it was
// sent), at `reportedAt`; `played` carries it on from there while it plays.
const duration = ref(0)
const current = ref(0)
const loaded = ref(0)
const played = ref(0)
let reportedAt = 0

function tick() {
  const since = state.value === 'playing' && !scrubbing.value ? (performance.now() - reportedAt) / 1000 : 0
  played.value = Math.min(duration.value, current.value + since)
}

const { pause: rest, resume: run } = useRafFn(tick, { immediate: false })

type Info = { playerState?: number, currentTime?: number, duration?: number, videoLoadedFraction?: number }

function report(info: Info) {
  if (info.duration) duration.value = info.duration
  if (typeof info.videoLoadedFraction === 'number') loaded.value = info.videoLoadedFraction
  if (typeof info.currentTime === 'number' && !scrubbing.value) {
    current.value = info.currentTime
    reportedAt = performance.now()
  }
  tick()
}

useEventListener(window, 'message', (event: MessageEvent) => {
  if (event.origin !== PLAYER || event.source !== frame.value?.contentWindow) return
  let data: { event?: string, info?: unknown }
  try {
    data = JSON.parse(event.data)
  }
  catch {
    return
  }
  const info = data.info as Info | number | undefined
  if (info && typeof info === 'object') report(info)
  const playerState = data.event === 'onStateChange' ? info : (info as Info | undefined)?.playerState
  // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued.
  if (playerState === 1) state.value = 'playing'
  else if (playerState === 2 && state.value !== 'loading') state.value = 'paused'
  else if (playerState === 0) state.value = 'ended'
})

// Dragged along: the bar follows the pointer, and the player follows the bar
// (from what it has loaded, and no more often than it can keep up with).
// Let go, it loads the spot. A press anywhere on the bar starts there.
const scrubbing = ref(false)
const track = useTemplateRef<HTMLElement>('track')
let sentAt = 0

watch([state, scrubbing], () => {
  tick()
  if (state.value === 'playing' && !scrubbing.value) run()
  else rest()
})

function seek(to: number, ahead: boolean) {
  to = Math.max(0, Math.min(duration.value, to))
  current.value = played.value = to
  reportedAt = performance.now()
  if (state.value === 'ended') state.value = 'paused'
  if (!ahead && reportedAt - sentAt < 80) return
  sentAt = reportedAt
  command('seekTo', [to, ahead])
}

function timeAt(event: PointerEvent) {
  const box = track.value!.getBoundingClientRect()
  return ((event.clientX - box.left) / box.width) * duration.value
}

function grab(event: PointerEvent) {
  if (event.button !== 0) return
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  scrubbing.value = true
  seek(timeAt(event), false)
}

function drag(event: PointerEvent) {
  if (scrubbing.value) seek(timeAt(event), false)
}

function letGo() {
  if (!scrubbing.value) return
  scrubbing.value = false
  seek(played.value, true)
}

// From the keys: five seconds a step, thirty a page, or either end.
function step(event: KeyboardEvent) {
  const by = ({ ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -30, PageUp: 30 } as Record<string, number>)[event.key]
  const to = event.key === 'Home' ? 0 : event.key === 'End' ? duration.value : by === undefined ? undefined : played.value + by
  if (to === undefined) return
  event.preventDefault()
  seek(to, true)
}

watch(() => props.inactive, (inactive) => {
  if (!inactive || (state.value !== 'playing' && state.value !== 'loading')) return
  state.value = 'paused'
  command('pauseVideo')
})

function toggle() {
  if (state.value === 'idle') {
    state.value = 'loading'
    const params = new URLSearchParams({
      autoplay: '1',
      controls: '0',
      disablekb: '1',
      fs: '0',
      iv_load_policy: '3',
      playsinline: '1',
      rel: '0',
      enablejsapi: '1',
      origin: window.location.origin,
    })
    embed.value = `${PLAYER}/embed/${id.value}?${params}`
    return
  }
  if (state.value === 'playing') {
    state.value = 'paused'
    command('pauseVideo')
    return
  }
  if (state.value === 'ended') command('seekTo', [0, true])
  state.value = 'loading'
  command('playVideo')
}
</script>

<template>
  <MediaShell :wide="wide" class="media--video" :data-state="state">
    <!-- Filled, a touch is the frame's own: a sheet under it doesn't pull, the page doesn't swipe. -->
    <div ref="screen" class="media__frame video__frame" :class="{ 'is-filled': filled, 'is-large': large }"
      @touchstart.stop>
      <iframe v-if="embed" ref="frame" :src="embed" :title="title" tabindex="-1"
        allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"
        @load="listen" />
      <!-- A link until JS takes it over: then the cover is the one control,
           over the player for as long as it's there. -->
      <component :is="mounted ? 'button' : 'a'" :type="mounted ? 'button' : undefined"
        :href="mounted ? undefined : watchUrl" class="video__cover"
        :aria-label="`${state === 'playing' ? t('projects.media.pause') : t('projects.media.play')}: ${title}`"
        :aria-busy="state === 'loading'" @click="toggle">
        <img class="video__poster" :src="thumbnail" alt="" width="1280" height="720" loading="lazy" decoding="async">
        <span class="media__toggle video__toggle" aria-hidden="true">
          <span :class="state === 'playing' ? 'i-iconoir-pause-solid' : 'i-iconoir-play-solid'" />
        </span>
      </component>
      <div v-if="duration" ref="track" class="video__seek" :class="{ 'is-scrubbing': scrubbing }" role="slider"
        tabindex="0" :aria-label="`${t('projects.media.seek')}: ${title}`" aria-valuemin="0"
        :aria-valuemax="Math.round(duration)" :aria-valuenow="Math.round(played)"
        :aria-valuetext="`${formatClock(played)} / ${formatClock(duration)}`"
        :style="{ '--played': played / duration, '--loaded': loaded }" @pointerdown="grab" @pointermove="drag"
        @pointerup="letGo" @pointercancel="letGo" @keydown="step">
        <span class="video__time" aria-hidden="true">{{ formatClock(played) }}</span>
      </div>
      <button v-if="mounted" type="button" data-press="key" class="media__toggle media__expand video__expand"
        :aria-label="large ? t('projects.media.shrink') : t('projects.media.fullscreen')" :aria-pressed="large"
        @click="enlarge">
        <span :class="large ? 'i-iconoir-collapse' : 'i-iconoir-expand'" aria-hidden="true" />
      </button>
    </div>
    <template #caption>
      <slot mdc-unwrap="p" />
      <MediaOutLink :href="watchUrl" ms="group first:0" :class="{ 'video__out--alone': !slots.default }">{{
        t('projects.media.watch') }}</MediaOutLink>
    </template>
  </MediaShell>
</template>

<style scoped>
.video__frame {
  aspect-ratio: 16 / 9;
}

.video__frame> :is(iframe, .video__cover) {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  border: 0;
}

.video__cover {
  display: block;
  padding: 0;
  background: none;
  cursor: pointer;
}

.video__cover:focus-visible {
  outline-offset: -0.25rem;
}

.video__poster {
  block-size: 100%;
  object-fit: cover;
  transition: opacity 300ms var(--ease-out);
}

/* Playing, the thumbnail lifts off the player. Paused, it stays off and a
   veil dims the held frame instead, so the video reads as paused, not reset.
   Anything else puts it back over YouTube's own screens. */
[data-state='playing'] .video__poster,
[data-state='paused'] .video__poster {
  opacity: 0;
}

.video__cover::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 0.5);
  opacity: 0;
  transition: opacity 300ms var(--ease-out);
  pointer-events: none;
}

[data-state='paused'] .video__cover::before {
  opacity: 1;
}

/* The control sits where the loops keep theirs. While the video plays it
   steps back until the pointer or focus reaches the video. */
.video__cover:is(:hover, :focus-visible) .video__toggle {
  opacity: 1;
}

[data-state='playing'] .video__cover:not(:hover, :focus-visible) .video__toggle {
  opacity: 0;
}

[data-state='loading'] .video__toggle {
  cursor: progress;
  opacity: 0.4;
}

/* Fullscreen, or filling the window: the video at its own shape on black,
   the thumbnail too, rather than cropped to the screen's. */
.video__frame.is-large {
  aspect-ratio: auto;
  background: #000;
}

.video__frame.is-large .video__poster {
  object-fit: contain;
}

.video__frame.is-filled {
  position: fixed;
  inset: 0;
  z-index: 100;
  touch-action: none;
}

/* Its place in the page is held meanwhile, so nothing moves up under it. */
.media--video:has(> .is-filled)::before {
  content: '';
  display: block;
  aspect-ratio: 16 / 9;
}

:global(html:has(.video__frame.is-filled)) {
  overflow: hidden;
}

/* The seek bar: the rest of the controls' row, left of fullscreen and play,
   all of its height to press. The line on it is the stage's color with
   what's loaded shaded in and what's played in ink; the square on it is
   where the video is, with the time over it while it's dragged or reached. */
.video__seek {
  position: absolute;
  inset-block-end: var(--space-3);
  inset-inline: var(--space-3) calc(var(--space-3) + 5rem + 2 * var(--space-2));
  block-size: 2.5rem;
  cursor: pointer;
  touch-action: none;
  opacity: 0.72;
  transition: opacity 200ms var(--ease-out);
}

.video__seek::before,
.video__seek::after {
  content: '';
  position: absolute;
  inset-block-start: 50%;
  translate: 0 -50%;
}

.video__seek::before {
  inset-inline: 0;
  block-size: 0.25rem;
  background: linear-gradient(to right,
      var(--fg) 0 calc(var(--played) * 100%),
      color-mix(in srgb, var(--fg) 35%, var(--bg)) 0 calc(var(--loaded) * 100%),
      var(--bg) 0);
}

.video__seek::after {
  inset-inline-start: calc(var(--played) * 100%);
  inline-size: 0.75rem;
  block-size: 0.75rem;
  translate: -50% -50%;
  background: var(--fg);
  box-shadow: 0 0 0 2px var(--bg);
  transition: scale 150ms var(--ease-out);
}

.media__frame:hover .video__seek,
.video__seek:focus-visible,
.video__seek.is-scrubbing {
  opacity: 1;
}

.video__seek:focus-visible {
  outline-offset: 0;
}

.video__seek:is(:hover, .is-scrubbing)::after {
  scale: 1.35;
}

.video__time {
  position: absolute;
  inset-block-end: 100%;
  inset-inline-start: calc(var(--played) * 100%);
  translate: -50% 0;
  padding: 0.125rem 0.375rem;
  background: var(--bg);
  color: var(--fg);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 150ms var(--ease-out);
  pointer-events: none;
}

.video__seek:is(.is-scrubbing, :focus-visible) .video__time {
  opacity: 1;
}

/* The fullscreen control and the seek bar step back with play while the
   video runs, until the pointer or focus reaches the video. A touch has no
   pointer to bring them back, so there they stay: the bar to drag, and the
   way out of a filled window. */
@media (hover: hover) {
  [data-state='playing'] .video__frame:not(:hover) :is(.video__expand, .video__seek):not(:focus-visible, .is-scrubbing) {
    opacity: 0;
  }
}

/* With no caption, the link starts its own line. */
.media__caption > .video__out--alone {
  margin-inline-start: 0;
}
</style>
