<script setup lang="ts">
/**
 * A project's own website, live inside the case study, placed from markdown:
 *
 *   ::media-site{src="https://tlapalli.ackzell.dev" poster="/media/tlapalli/site-dark.webp" posterLight="…" posterNarrow="…" posterNarrowLight="…" wide}
 *   Caption, in the page's own language.
 *   ::
 *
 * It opens as a capture of the site and only loads the real thing when
 * asked: a frame that loads by itself costs every visitor the whole site,
 * and catches the scroll wheel of anyone just passing through. Once the site
 * has loaded, the capture rolls up off it, top first, the way a page draws.
 * The way out to the site itself is always there, and is all there is
 * without JS. Posters are 16:10 desktop captures, plus optional narrow ones
 * (390 × 700) for small screens.
 */
const props = defineProps<{
  src: string
  /** The frame's accessible name; defaults to the site's host. */
  title?: string
  poster?: string
  posterLight?: string
  posterNarrow?: string
  posterNarrowLight?: string
  wide?: boolean
}>()

const { t } = useI18n()
const slots = useSlots()
const mounted = useMounted()

const host = computed(() => new URL(props.src).host)

// idle: the capture. loading: the frame is on its way, under the capture.
// live: the frame is in, the capture has rolled away.
const state = ref<'idle' | 'loading' | 'live'>('idle')

const NARROW = '(width < 40rem)'

const figure = useTemplateRef<HTMLElement>('figure')
const reducedMotion = usePreferredReducedMotion()

// Bring the whole frame into view as it goes live: two quiet sites side by
// side are hard to tell apart, so the embedded one gets the screen to itself.
// scroll-padding keeps it clear of the sticky header.
function tryLive() {
  state.value = 'loading'
  figure.value?.scrollIntoView({ behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth', block: 'start' })
}
</script>

<template>
  <figure ref="figure" class="media media--site" :class="{ 'track-wide': wide }" :data-state="state">
    <!-- The mat: a field around the bar and the frame, so the embedded site
         reads as one object set on the stage, not as more of this page. -->
    <div class="site__mat">
      <div class="site__bar">
        <span class="site__host">{{ host }}</span>
        <span class="site__actions">
          <button v-if="mounted && state !== 'live'" type="button" class="site__try" :disabled="state === 'loading'"
            @click="tryLive">
            {{ t('projects.media.tryLive') }}
          </button>
          <a :href="src" class="media__out">{{ t('projects.media.openSite') }}<span class="i-iconoir-arrow-up-right"
              aria-hidden="true" /></a>
        </span>
      </div>

      <div class="media__frame site__viewport" :aria-busy="state === 'loading'">
        <iframe v-if="state !== 'idle'" :src="src" :title="title ?? host" referrerpolicy="no-referrer"
          @load="state = 'live'" />
        <!-- Decorative once the frame is live; until then the bar names the site. -->
        <picture v-if="poster" class="site__poster" :aria-hidden="state === 'live'">
          <source v-if="posterNarrow" :srcset="posterNarrow" :media="NARROW">
          <img :src="poster" alt="" width="2160" height="1350" loading="lazy" decoding="async"
            :data-scheme="posterLight ? 'dark' : undefined">
        </picture>
        <!-- The light capture as its own picture, so the site's scheme switch
             (classes, not the media query) picks which one shows. -->
        <picture v-if="posterLight" class="site__poster" :aria-hidden="state === 'live'">
          <source v-if="posterNarrowLight" :srcset="posterNarrowLight" :media="NARROW">
          <img :src="posterLight" alt="" width="2160" height="1350" loading="lazy" decoding="async" data-scheme="light">
        </picture>
      </div>
    </div>

    <figcaption v-if="slots.default" class="media__caption">
      <slot mdc-unwrap="p" />
    </figcaption>
  </figure>
</template>

<style scoped>
/* A field of the foreground, not a line: the same flat planes the flag band
   is made of. Live, it warms toward the accent, so the switch from capture
   to the real site reads at a glance. */
.site__mat {
  padding: var(--space-2) var(--space-2) var(--space-2);
  background: color-mix(in srgb, var(--fg) 9%, var(--bg));
  transition: background-color 600ms var(--ease-out);
}

[data-state='live'] .site__mat {
  background: color-mix(in srgb, var(--accent) 22%, var(--bg));
}

@media (width < 40rem) {
  .site__mat {
    padding: var(--space-2);
  }
}

.site__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--gap-tight) var(--gap-group);
  padding-block-end: var(--space-2);
}

.site__host {
  font-family: var(--font-code);
  font-weight: var(--code-weight);
  color: var(--muted);
}

.site__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--gap-group);
}

/* The one action on the stage: set in the accent, as a word, not a pill. */
.site__try {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: var(--accent);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, currentColor 35%, transparent);
  text-underline-offset: 0.25em;
}

.site__try:hover {
  text-decoration-color: currentColor;
}

.site__try:disabled {
  cursor: progress;
  color: var(--muted);
}

/* Desktop proportions on the wide track; a phone's on small screens, where
   the frame shows the site's own narrow layout. Never taller than the room
   between the sticky header and footer, less the mat and its bar, so the
   live site fits on screen whole once it's scrolled into view. Sized from
   the mat's width (cqi) rather than aspect-ratio, which would narrow the
   frame to keep its proportions under the cap; the capture crops from its
   top instead. */
.site__mat {
  container-type: inline-size;
  --site-room: max(20rem, 100svh - var(--header-height, 0px) - var(--footer-height, 0px) - 4rem);
}

.site__viewport {
  position: relative;
  block-size: min(100cqi * 10 / 16, var(--site-room));
}

@media (width < 40rem) {
  .site__viewport {
    block-size: min(100cqi * 700 / 390, var(--site-room));
  }
}

.site__viewport> :is(iframe, .site__poster) {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  border: 0;
}

.site__poster img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  object-position: top;
}

/* While the site loads, a field of the accent runs along the frame's top
   edge, the same weight as the flag band's fields. */
.site__viewport::after {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  block-size: 0.25rem;
  background: var(--accent);
  transform-origin: left;
  scale: 0 1;
  opacity: 0;
  pointer-events: none;
}

[data-state='loading'] .site__viewport::after {
  opacity: 1;
  animation: site-loading 1.6s var(--ease-in-out) infinite;
}

@keyframes site-loading {
  0% {
    scale: 0 1;
    transform-origin: left;
  }

  50% {
    scale: 1 1;
    transform-origin: left;
  }

  50.01% {
    transform-origin: right;
  }

  100% {
    scale: 0 1;
    transform-origin: right;
  }
}

/* The capture rolls up off the live site, top first. */
.site__poster {
  clip-path: inset(0 0 0 0);
  transition: clip-path 900ms var(--ease-out);
}

[data-state='live'] .site__poster {
  clip-path: inset(100% 0 0 0);
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .site__poster {
    transition: opacity 300ms var(--ease-out);
  }

  [data-state='live'] .site__poster {
    clip-path: none;
    opacity: 0;
  }

  [data-state='loading'] .site__viewport::after {
    animation: none;
    scale: 1 1;
    opacity: 0.5;
  }
}
</style>
