<script setup lang="ts">
/**
 * The stops on either side along the flag band: where a swipe or ← / →
 * would go, for whoever reads to the end (and the sign, on touch, that
 * there's a way on at all). Neither past either end of the band, nor on a
 * page off it.
 *
 * Each is written as the route it is: its folders small in code type, then
 * the page itself by name, so a part shows its project as the folder it sits
 * in (/projects/tlapalli/ themes). A line runs under it, a field like the
 * band's; hover or focus fills it the way it goes, in that section's own
 * color when it crosses into one.
 *
 * Two places: on a wide screen it sits in the footer, between the socials
 * and the scheme switch (`bar`), always in reach; narrower, at the foot of
 * the page, the one before at the text's start and the one after at its end.
 * Each copy hides where the other shows. The footer's stays put while pages
 * change under it, so its names decode into the new ones; the page's comes
 * in with its page and just shows them.
 */
defineProps<{ bar?: boolean }>()

const route = useRoute()
const section = useSection()
const { from } = useNavStops()

const ways = computed(() =>
  ([['prev', -1], ['next', 1]] as const).flatMap(([rel, by]) => {
    const stop = from(route.path, by)
    if (!stop) return []
    // The route as the site names it, without the language's /es.
    return [{ rel, ...stop, folders: stop.to.slice(0, stop.to.lastIndexOf('/') + 1) }]
  }),
)
</script>

<template>
  <div v-if="ways.length" class="next-stop" :class="bar ? 'next-stop--bar' : 'page next-stop--page'">
    <div class="next-stop__row">
      <NuxtLinkLocale v-for="way in ways" :key="way.rel" :to="way.to" :rel="way.rel" :data-way="way.rel"
        :data-crossing="way.section !== section || undefined" :style="{ '--field': `var(--field-${way.section})` }"
        class="stop">
        <span class="stop__route">
          <span v-if="way.rel === 'prev'" class="stop__arrow i-iconoir-arrow-left" aria-hidden="true" />
          <span class="stop__path">
            <SiteScrambleText :text="way.folders" :still="!bar" class="stop__folders" aria-hidden="true" />
            <SiteScrambleText :text="way.label" :still="!bar" class="stop__name" :lang="way.lang" />
          </span>
          <span v-if="way.rel === 'next'" class="stop__arrow i-iconoir-arrow-right" aria-hidden="true" />
        </span>
        <span class="stop__field" aria-hidden="true" />
      </NuxtLinkLocale>
    </div>
  </div>
</template>

<style scoped>
/* One copy at a time: the footer's from 64rem, the page's below it. */
.next-stop--bar {
  display: none;
}

@media (width >=64rem) {
  .next-stop--bar {
    display: block;
  }

  .next-stop--page {
    display: none;
  }
}

/* The page above already ends a section's gap from here. */
.next-stop--page {
  padding-block: 0 var(--gap-section);
}

.next-stop__row {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: var(--gap-group);
}

.next-stop--bar .next-stop__row {
  justify-content: center;
  gap: var(--gap-block);
}

.stop {
  display: grid;
  gap: var(--space-2);
  min-inline-size: 0;
  color: var(--fg);
  text-decoration: none;
}

/* On the page, alone or not, the one after keeps to the text's end. */
.next-stop--page .stop[data-way='next'] {
  margin-inline-start: auto;
  justify-items: end;
  text-align: end;
}

.stop__route {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

/* The folders and the name share a baseline, and wrap between them when
   the two don't fit. */
.stop__path {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 0.1ch;
}

.next-stop--page .stop[data-way='next'] .stop__path {
  justify-content: flex-end;
}

/* As the header's lang="…" and the footer's color-scheme="…", dimmed as
   the band dims its children (--muted drops under 4.5:1 on the red stage). */
.stop__folders {
  font-family: var(--font-code);
  font-weight: var(--code-weight);
  font-variation-settings: 'CASL' 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: color-mix(in srgb, var(--fg) 80%, var(--bg));
}

/* The name in the folders' own type and size, set apart only by weight. */
.stop__name {
  font-family: var(--font-code);
  font-weight: 600;
  font-variation-settings: 'CASL' 0;
  font-size: 0.75rem;
  line-height: 1.4;
}

.stop__arrow {
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--fg) 80%, var(--bg));
  transition: translate 200ms var(--ease-out);
}

/* Under the whole route, whichever way the stop is aligned. */
.stop__field {
  position: relative;
  justify-self: stretch;
  min-inline-size: 7rem;
  block-size: 2px;
  background: var(--line);
}

.stop__field::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 240ms var(--ease-out);
}

/* Back fills the other way. */
[data-way='prev'] .stop__field::after {
  transform-origin: right;
}

/* Into another section: its own flag fills the field. */
[data-crossing] .stop__field::after {
  background: var(--field);
}

.stop:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: var(--space-2);
}

@media (hover: hover) and (pointer: fine) {
  .stop:hover .stop__field::after {
    transform: scaleX(1);
  }

  .stop[data-way='next']:hover .stop__arrow {
    translate: var(--space-1) 0;
  }

  .stop[data-way='prev']:hover .stop__arrow {
    translate: calc(-1 * var(--space-1)) 0;
  }
}

.stop:is(:focus-visible, :active) .stop__field::after {
  transform: scaleX(1);
}

.stop[data-way='next']:focus-visible .stop__arrow {
  translate: var(--space-1) 0;
}

.stop[data-way='prev']:focus-visible .stop__arrow {
  translate: calc(-1 * var(--space-1)) 0;
}

@media (prefers-reduced-motion: reduce) {
  .stop__arrow {
    transition: none;
  }

  .stop[data-way]:is(:hover, :focus-visible) .stop__arrow {
    translate: none;
  }

  .stop__field::after {
    transform: none;
    opacity: 0;
    transition: opacity 120ms ease;
  }

  .stop:is(:hover, :focus-visible, :active) .stop__field::after {
    transform: none;
    opacity: 1;
  }
}
</style>
