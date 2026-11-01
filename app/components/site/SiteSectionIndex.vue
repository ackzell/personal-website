<script setup lang="ts">
/**
 * The page's sections as a running head, for pages whose sections sit far
 * apart: on arrival it already names what is further down, so a fold landing
 * in a gap between sections doesn't read as the end of the page.
 *
 * Wide screens set it in the empty margin left of the text, a short list that
 * sticks level with the landing mark. Narrower ones, where that margin is too
 * thin for the longest name, set it as one row right under the band, the
 * landing mark moved down to make room, that sticks there and scrolls
 * sideways, as the band's stops do, keeping the current name in view.
 *
 * A running head set small, at the band's child label size: the section being
 * read at full brightness, the rest dimmed (The Brightness Hierarchy Rule): the one crossing a line a third of the way down
 * the viewport, as the experience band reads its roles, or the last one once
 * the page can't scroll further. No glow: light stays with the band.
 *
 * Each name is a link to its section, so it works without script; with it the
 * page travels there and the target stays current on the way.
 *
 * Pages where content can take the whole width (projects) ask for the row at
 * every width (layout="row"), so it never sits over their media.
 *
 * Place it as the first child of `.page`: it spans the rows of the sections
 * after it, so its sticky range is theirs.
 */
const props = withDefaults(defineProps<{
  items: { id: string, label: string }[]
  /** auto: in the margin where it fits, else a row. row: always the row under the band. */
  layout?: 'auto' | 'row'
}>(), { layout: 'auto' })

const { t } = useI18n()
const reducedMotion = usePreferredReducedMotion()

const list = useTemplateRef<HTMLElement>('list')
const links = useTemplateRef<HTMLElement[]>('links')

const current = ref(props.items[0]?.id)

// The row layout: asked for, or the margin is too thin, so it sits under the
// band instead.
const narrow = useMediaQuery('(width < 60rem)')
const row = computed(() => props.layout === 'row' || narrow.value)

// While a followed link scrolls the page, the target stays current instead of
// every section on the way. Released once scrolling settles.
const travelling = ref(false)
const arrive = useDebounceFn(() => {
  travelling.value = false
  readEnd()
}, 150)

const targets = ref<HTMLElement[]>([])
onMounted(() => {
  targets.value = props.items
    .map(({ id }) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null)
  readEnd()
})

useIntersectionObserver(targets, (records) => {
  if (travelling.value) return
  for (const record of records) {
    if (record.isIntersecting) current.value = record.target.id
  }
}, { rootMargin: '-33% 0px -66% 0px' })

// A last section too short to reach the reading line is current once the
// page can't scroll any further.
function readEnd() {
  const doc = document.documentElement
  if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) current.value = props.items.at(-1)?.id
}

useEventListener('scroll', () => {
  if (travelling.value) arrive()
  else readEnd()
}, { passive: true })

function go(event: MouseEvent, id: string) {
  const el = document.getElementById(id)
  if (!el) return
  event.preventDefault()
  current.value = id
  travelling.value = true
  // Already in place: no scroll comes to release it.
  arrive()
  const behavior = reducedMotion.value === 'reduce' ? 'auto' : 'smooth'
  // The first section is the top of the page, landing mark and all.
  if (id === props.items[0]?.id) window.scrollTo({ top: 0, behavior })
  else el.scrollIntoView({ block: 'start', behavior })
}

// The row keeps the current name in view, scrolling only itself: scrollIntoView
// would move the page too.
watch([current, row], async () => {
  if (!row.value) return
  await nextTick()
  const box = list.value
  const link = links.value?.[props.items.findIndex(({ id }) => id === current.value)]
  if (!box || !link) return
  const { offsetLeft: left, offsetWidth: width } = link
  if (left >= box.scrollLeft && left + width <= box.scrollLeft + box.clientWidth) return
  box.scrollTo({ left: left - (box.clientWidth - width) / 2, behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth' })
})

// Names running past the row's end fade out there, so the row reads as
// going on.
const overflowing = ref(false)
const readOverflow = () => {
  const box = list.value
  overflowing.value = !!box && box.scrollLeft + box.clientWidth < box.scrollWidth - 1
}
useResizeObserver(list, readOverflow)
useEventListener(list, 'scroll', readOverflow, { passive: true })
</script>

<template>
  <nav class="section-index" :class="{ 'section-index--auto': layout === 'auto' }" data-stick data-own-entrance :aria-label="t('site.sectionIndex')" :style="{ '--rows': items.length }">
    <!-- As a row it paints the stage over the text scrolling under it, so it
         carries a clipped copy of the mark, as the header does. -->
    <div class="section-index__bar">
      <SiteMarkLayer clipped class="section-index__mark" />
      <ol ref="list" class="section-index__list" data-arrives-itself :class="{ 'is-overflowing': overflowing }" m="0" p="0" list="none">
        <li v-for="(item, i) in items" :key="item.id" class="section-index__item" :style="{ '--i': i }">
          <a ref="links" :href="`#${item.id}`"
            class="section-index__link block decoration-none uppercase tracking-[0.08em] text-[0.60rem] leading-[1.4] text-balance text-[var(--index-rest)] transition-colors duration-150 op-60 hover:text-fg active:text-fg current:text-fg current:op-100"
            :aria-current="current === item.id ? 'location' : undefined" @click="go($event, item.id)">{{ item.label
            }}</a>
        </li>
      </ol>
    </div>
  </nav>
</template>

<style scoped>
/*
 * As a row (the default, and always with layout="row"): right under the
 * band, across the wide track, and stuck there: wide media (a project's
 * video) scroll under all of it, not past its sides. The nav takes no width
 * of its own, so its bar runs from the wide track's start across it, the
 * names centered there while they fit (auto margins, so a row that overflows
 * still scrolls from its first name); the tracks are symmetric, so that is
 * the text column's center too. The page starts lower by the row's
 * height (main.css) and the row lifts back up through that and the page's
 * top space, so it sits on the band while what opens the page keeps its
 * distance below.
 */
.section-index {
  --stick-top: var(--header-height, 0px);
  /* The names not being read, at 60% of the text color. */
  --index-rest: color-mix(in srgb, var(--fg) 60%, var(--bg));
  grid-column: wide-start / content-start;
  grid-row: 1 / span var(--rows);
  justify-self: start;
  align-self: start;
  inline-size: 0;
  position: sticky;
  top: var(--stick-top);
  z-index: 3;
  margin-block-start: calc(-1 * (var(--gap-block) + var(--section-index-height, 0px)));
}

/* A stacking context for the mark copy: the row paints the stage over the
   text scrolling under it, so it carries the mark as the header does. */
.section-index__bar {
  position: relative;
  isolation: isolate;
  /* The wide track's width, from 100vw: this nav has none to measure. */
  inline-size: min(var(--wide-width), 100vw - var(--gutter) * 2);
  /* Known ahead (main.css), so nothing shifts once the page wakes up. */
  block-size: var(--section-index-height);
  /* Content scrolls under it, as it does under the header. */
  background-color: var(--bg);
  transition: background-color 600ms var(--ease-out);
}

.section-index__list {
  display: flex;
  align-items: start;
  block-size: 100%;
  gap: var(--gap-block);
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}

.section-index__list > :first-child {
  margin-inline-start: auto;
}

.section-index__list > :last-child {
  margin-inline-end: auto;
}

.section-index__list::-webkit-scrollbar {
  display: none;
}

.section-index__list.is-overflowing {
  mask-image: linear-gradient(to right, #000 calc(100% - var(--gap-block)), transparent);
}

.section-index__link {
  white-space: nowrap;
  /* A comfortable target without growing the row's look. */
  padding-block: var(--space-2);
  margin-block: calc(-1 * var(--space-2));
}

/*
 * Entrance: the names come in one after another, each developing out of a
 * blur as it lands, rippling in from the side along the row, as the band's
 * labels do, or from a little below in the margin, on the site's spring
 * (vt-develop and vt-lift, main.css). The nav skips the page's own rise
 * (data-own-entrance), so the names arrive once. They play on every visit:
 * arriving from another page, the list keeps this entrance rather than
 * moving in as one of the page's blocks (data-arrives-itself), starting on
 * its block's beat (--arrive-delay, utils/pageArrival).
 */
@media (prefers-reduced-motion: no-preference) {
  .section-index__item {
    --lift-from: calc(-1 * var(--space-3)) 0;
    --item-delay: calc(var(--arrive-delay, 150ms) + var(--i) * 90ms);
    animation:
      450ms var(--ease-out) var(--item-delay) both vt-develop,
      var(--arrive-duration) var(--ease-arrive) var(--item-delay) both vt-lift;
  }
}

/* Phones: the brand row tucks away and the icon rail takes the inline end
   (main.css), so the track is narrower by the rail less a gutter. */
@media (width < 40rem) {
  .section-index {
    --stick-top: calc(var(--header-height, 0px) - var(--header-tuck, 0px));
  }

  .section-index__bar {
    inline-size: min(var(--wide-width), 100vw - var(--rail-width, 0px) - var(--gutter));
  }
}

/*
 * In the margin (layout="auto", from 60rem): the wide track left of the
 * text, through every section, a short list level with the landing mark.
 * It paints no stage there, so it carries no mark copy (a second copy would
 * double the mark) and takes no height (main.css).
 */
@media (width >= 60rem) {
  .section-index--auto {
    justify-self: stretch;
    inline-size: auto;
    /* Level with the landing mark, which holds at the same line (HomeIntro). */
    top: calc(var(--header-height, 0px) + var(--gap-section));
    /* Starts with the first section, under its gap. */
    margin-block-start: var(--gap-section);
    padding-inline-end: var(--gap-group);
  }

  .section-index--auto .section-index__bar {
    inline-size: auto;
    block-size: auto;
    background-color: transparent;
  }

  .section-index--auto .section-index__mark {
    display: none;
  }

  .section-index--auto .section-index__list {
    display: grid;
    gap: var(--gap-tight);
    block-size: auto;
    overflow: visible;
  }

  .section-index--auto .section-index__list > * {
    margin-inline: 0;
  }

  .section-index--auto .section-index__link {
    white-space: normal;
    padding-block: 0;
    margin-block: 0;
  }

  .section-index--auto .section-index__item {
    --lift-from: 0 var(--space-3);
  }
}
</style>
