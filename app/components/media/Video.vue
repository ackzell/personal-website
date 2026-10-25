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
 * end screens. Play and pause are the only controls, sent to the player
 * through its postMessage API. Without JS the thumbnail is a plain link to
 * the video. `poster` keeps the thumbnail local; without it, YouTube's own
 * is used.
 */
const props = defineProps<{
  /** Any YouTube link: youtu.be/…, watch?v=…, or /embed/…. */
  src: string
  /** The video's own title: the player's accessible name. */
  title: string
  poster?: string
  wide?: boolean
}>()

const { t } = useI18n()
const slots = useSlots()
const mounted = useMounted()

const PLAYER = 'https://www.youtube-nocookie.com'

const id = computed(() => {
  const url = new URL(props.src)
  return url.searchParams.get('v') ?? url.pathname.split('/').pop()!
})
const watchUrl = computed(() => `https://www.youtube.com/watch?v=${id.value}`)
const thumbnail = computed(() => props.poster ?? `https://i.ytimg.com/vi/${id.value}/maxresdefault.jpg`)

// idle: only the thumbnail, no player yet. loading: the player is on its way
// (or resuming) under the thumbnail. playing: the thumbnail is off it.
// paused / ended: the thumbnail is back over YouTube's own screens.
const state = ref<'idle' | 'loading' | 'playing' | 'paused' | 'ended'>('idle')
const embed = ref<string>()
const frame = useTemplateRef<HTMLIFrameElement>('frame')

function command(func: string, args: unknown[] = []) {
  frame.value?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), PLAYER)
}

// Ask the player to report its state; it answers on window 'message'.
function listen() {
  frame.value?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: id.value, channel: 'widget' }), PLAYER)
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
  const info = data.info as { playerState?: number } | number | undefined
  const playerState = data.event === 'onStateChange' ? info : (info as { playerState?: number } | undefined)?.playerState
  // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued.
  if (playerState === 1) state.value = 'playing'
  else if (playerState === 2 && state.value !== 'loading') state.value = 'paused'
  else if (playerState === 0) state.value = 'ended'
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
  <figure class="media media--video" :class="{ 'track-wide': wide }" :data-state="state">
    <div class="media__frame video__frame">
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
    </div>
    <figcaption class="media__caption">
      <slot mdc-unwrap="p" />
      <a :href="watchUrl" class="media__out" :class="{ 'video__out--alone': !slots.default }">{{ t('projects.media.watch')
      }}<span class="i-iconoir-arrow-up-right" aria-hidden="true" /></a>
    </figcaption>
  </figure>
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

/* With no caption, the link starts its own line. */
.media__caption > .video__out--alone {
  margin-inline-start: 0;
}
</style>
