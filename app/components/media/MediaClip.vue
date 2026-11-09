<script setup lang="ts">
/**
 * A short silent loop in a case study (Motion Canvas renders, screen
 * captures), placed from markdown:
 *
 *   ::media-clip{src="/media/tlapalli/intro.mp4" webm="/media/tlapalli/intro.webm" poster="/media/tlapalli/intro.webp" label="…" width="1920" height="1080" youtube="https://youtu.be/…"}
 *   Caption, in the page's own language.
 *   ::
 *
 * It plays while it's on screen and rests when it isn't. Under reduced motion
 * (or on a slow connection, see useAutoplay) it never starts on its own: the
 * poster stays until it's asked to play. A
 * pause control is always there, since a loop never ends by itself. Without
 * JS it's a plain video with the browser's controls. `youtube` links the
 * full, narrated version.
 */
const props = defineProps<{
  src: string
  webm?: string
  poster?: string
  /** What the clip shows, for anyone who can't see it. */
  label: string
  width: number | string
  height: number | string
  youtube?: string
  wide?: boolean
  /** Laid out but not shown (a MediaPalette clip that isn't picked): it rests. */
  inactive?: boolean
  /** Offers a larger view: an expand control, and the clip itself, emit `expand`. */
  expandable?: boolean
}>()

const emit = defineEmits<{ expand: [] }>()

const { t } = useI18n()
const slots = useSlots()

const video = useTemplateRef<HTMLVideoElement>('video')
const mounted = useMounted()
const autoplay = useAutoplay()

// null until the visitor chooses; then their choice wins over the default.
const wants = ref<boolean | null>(null)
const visible = ref(false)
const playing = ref(false)

useIntersectionObserver(video, ([entry]) => {
  visible.value = entry?.isIntersecting ?? false
}, { threshold: 0.5 })

const shouldPlay = computed(() =>
  visible.value && !props.inactive && (wants.value ?? autoplay.value))

watch(shouldPlay, (play) => {
  const el = video.value
  if (!el) return
  // play() rejects when the browser blocks it; the poster simply stays.
  if (play) el.play().catch(() => {})
  else el.pause()
})

function toggle() {
  wants.value = !playing.value
  // Off screen the observer won't flip anything, so act on the click directly.
  if (wants.value) video.value?.play().catch(() => {})
  else video.value?.pause()
}

const source = (url: string) => (url.endsWith('.webm') ? 'video/webm' : 'video/mp4')
</script>

<template>
  <MediaShell :wide="props.wide" class="media--clip">
    <div class="media__frame">
      <video ref="video" :poster="poster" :width="width" :height="height" :aria-label="label" :controls="!mounted"
        muted loop playsinline preload="metadata" :class="{ 'media__expandable': expandable && mounted }"
        @play="playing = true" @pause="playing = false" @click="expandable && mounted && emit('expand')">
        <source v-if="webm" :src="webm" type="video/webm">
        <source :src="src" :type="source(src)">
      </video>
      <button v-if="mounted" type="button" data-press="key" class="media__toggle" :aria-label="playing ? t('projects.media.pause') : t('projects.media.play')" @click="toggle">
        <span :class="playing ? 'i-iconoir-pause-solid' : 'i-iconoir-play-solid'" aria-hidden="true" />
      </button>
      <button v-if="mounted && expandable" type="button" data-press="key" class="media__toggle media__expand"
        :aria-label="t('projects.media.expand')" @click="emit('expand')">
        <span class="i-iconoir-expand" aria-hidden="true" />
      </button>
    </div>
    <template v-if="slots.default || youtube" #caption>
      <slot mdc-unwrap="p" />
      <MediaOutLink v-if="youtube" :href="youtube" ms="group first:0">{{ t('projects.media.youtube') }}</MediaOutLink>
    </template>
  </MediaShell>
</template>
