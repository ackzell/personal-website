<script setup lang="ts">
/**
 * The media hub as two doors: one big target each for the videos and the
 * podcast, with what's behind it in a line. The headword link covers its whole
 * door (as in the project lexicon), pointing at one leans its word and steps
 * the other back. The word travels to the section's heading, as a project's
 * does (utils/viewTransition.ts).
 */
const props = defineProps<{
  videos: GuideSeries[]
  podcast: GuideSeries[]
}>()

const { t, n } = useI18n()

// "2017–2026" across a set of series.
function years(series: GuideSeries[]) {
  const dates = series.flatMap((row) => row.releases.map((release) => release.published)).sort()
  const from = dates[0]?.slice(0, 4)
  const to = dates.at(-1)?.slice(0, 4)
  return from === to ? from : `${from}–${to}`
}

const hours = (series: GuideSeries[]) => n(series.flatMap((row) => row.releases).reduce((total, { duration = 0 }) => total + duration, 0) / 3600, { maximumFractionDigits: 1 })
const episodes = (series: GuideSeries[]) => series.reduce((total, row) => total + row.releases.length, 0)

const doors = computed(() => [
  {
    slug: 'videos' as const,
    title: t('videos.title'),
    intro: t('videos.intro'),
    stats: `${t('media.guide.playlists', props.videos.length)} · ${years(props.videos)}`,
  },
  {
    slug: 'podcast' as const,
    title: t('podcast.title'),
    intro: t('podcast.intro'),
    stats: `${t('media.guide.episodes', episodes(props.podcast))} · ${years(props.podcast)} · ${hours(props.podcast)} h`,
  },
])
</script>

<template>
  <div class="doors">
    <section v-for="door in doors" :key="door.slug" class="doors__door" :aria-labelledby="`door-${door.slug}`">
      <h2 :id="`door-${door.slug}`" class="doors__word text-headword" m="0" typeset="heading">
        <NuxtLinkLocale :to="`/${door.slug}`" class="doors__link" decoration="none">
          <span :style="mediaTransition(door.slug)">
            <!-- One span per letter so the hover can ripple through the word.
                 Assistive tech gets the whole word from the hidden copy. -->
            <span class="sr-only">{{ door.title }}</span>
            <span aria-hidden="true">
              <span v-for="(char, i) in door.title" :key="i" class="doors__char" :style="{ '--i': i }">{{ char }}</span>
            </span>
          </span>
        </NuxtLinkLocale>
      </h2>
      <p m="0">{{ door.intro }}</p>
      <p class="doors__stats" m="0" text="sm muted">{{ door.stats }}</p>
      <span class="doors__arrow" aria-hidden="true">→</span>
    </section>
  </div>
</template>

<style scoped>
/* No gap between doors: padding is the spacing, so the pointer never falls
   between them and the spotlight never drops. */
.doors {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.doors__door {
  position: relative;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: var(--gap-group);
  min-block-size: clamp(10rem, 30vh, 18rem);
  padding: var(--gap-block) var(--gap-block) var(--gap-block) 0;
  transition: opacity 250ms var(--ease-out);
}

.doors__link {
  --slnt: 0;
  --casl: var(--heading-casual);
  --crsv: 0;
  color: var(--fg);
}

/* The link covers its whole door, so the door is one target. */
.doors__link::after {
  content: '';
  position: absolute;
  inset: 0;
}

.doors__stats {
  align-self: end;
  font-variant-numeric: tabular-nums;
}

.doors__arrow {
  color: var(--muted);
  font-size: 1.5rem;
  line-height: 1;
  transition: translate 250ms var(--ease-out), color 250ms var(--ease-out);
}

.doors:has(.doors__link:focus-visible) .doors__door:not(:focus-within) {
  opacity: 0.4;
}

.doors__link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}

/* The word writes itself, as a project's does: letter by letter it leans to
   -15deg, softens fully casual and switches to its cursive form (see
   ProjectLexicon for why each axis is timed on its own). */
.doors__link:focus-visible {
  --slnt: -15;
  --casl: 1;
  --crsv: 1;
}

.doors__char {
  font-variation-settings: 'CASL' var(--casl), 'CRSV' var(--crsv), 'slnt' var(--slnt);
  transition:
    --slnt 450ms var(--ease-out),
    --casl 450ms var(--ease-out),
    --crsv 0ms;
  transition-delay: calc(var(--i) * 30ms);
}

.doors__link:focus-visible .doors__char {
  transition:
    --slnt 600ms var(--ease-out),
    --casl 600ms var(--ease-out),
    --crsv 0ms;
  transition-delay:
    calc(var(--i) * 35ms),
    calc(var(--i) * 35ms),
    calc(var(--i) * 35ms + 60ms);
}

.doors__door:has(.doors__link:focus-visible) .doors__arrow {
  translate: 0.5rem 0;
  color: var(--fg);
}

@media (hover: hover) and (pointer: fine) {
  .doors:has(.doors__door:hover) .doors__door:not(:hover) {
    opacity: 0.4;
  }

  .doors__door:hover .doors__link {
    --slnt: -15;
    --casl: 1;
    --crsv: 1;
  }

  .doors__door:hover .doors__char {
    transition:
      --slnt 600ms var(--ease-out),
      --casl 600ms var(--ease-out),
      --crsv 0ms;
    transition-delay:
      calc(var(--i) * 35ms),
      calc(var(--i) * 35ms),
      calc(var(--i) * 35ms + 60ms);
  }

  .doors__door:hover .doors__arrow {
    translate: 0.5rem 0;
    color: var(--fg);
  }
}

@media (prefers-reduced-motion: reduce) {
  /* Same end state, no ripple. */
  .doors__char,
  .doors__door:hover .doors__char,
  .doors__link:focus-visible .doors__char {
    transition-duration: 150ms, 150ms, 0ms;
    transition-delay: 0ms;
  }

  .doors__arrow {
    transition-duration: 0ms;
  }
}

/* Phones: one door above the other. */
@media (width < 40rem) {
  .doors {
    grid-template-columns: minmax(0, 1fr);
  }

  .doors__door {
    min-block-size: 0;
    padding-inline-end: 0;
  }
}
</style>
