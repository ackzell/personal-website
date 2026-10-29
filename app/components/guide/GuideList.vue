<script setup lang="ts">
/**
 * A row's releases to browse, under the row on a wide screen or in a sheet
 * on a phone: in the playlist's order, or by what was watched or how long it
 * runs, narrowed by a word in the title. It starts at a dozen and opens out
 * on request, so 89 stills aren't asked for at once. In a sheet (`pinned`)
 * the sort and the search stay at the top as the list scrolls under them.
 * Then the way out to the playlist or the podcast, and to its project.
 */
export interface ListItem {
  release: GuideRelease
  number: number
  figures: { value: string, unit?: string, soft?: boolean }[]
}

const props = defineProps<{ row: GuideSeries, items: ListItem[], big?: boolean, pinned?: boolean }>()
// A pick of one of them; the guide decides whether the link is followed.
const emit = defineEmits<{ pick: [event: MouseEvent, item: ListItem] }>()

const { t, n } = useI18n()

type Order = 'order' | 'views' | 'length'
const orders: Order[] = ['order', 'views', 'length']
const order = ref<Order>('order')
const query = ref('')
const everything = ref(false)
const PAGE = 12

const found = computed(() => {
  const word = query.value.trim().toLowerCase()
  const kept = word ? props.items.filter(({ release }) => release.title.toLowerCase().includes(word)) : [...props.items]
  if (order.value === 'views') kept.sort((a, b) => (b.release.views ?? 0) - (a.release.views ?? 0))
  else if (order.value === 'length') kept.sort((a, b) => (b.release.duration ?? 0) - (a.release.duration ?? 0))
  return kept
})
const shown = computed(() => everything.value ? found.value : found.value.slice(0, PAGE))

// Motion: the list cascades in when it opens, and again from the first new
// one when it opens out; a re-sort or a narrowing glides what stays to its
// new place while what's gone fades where it stood (lifted out of the grid,
// so the rest can close up under it).
const cascadeFrom = ref(0)
function showAll() {
  cascadeFrom.value = PAGE
  everything.value = true
}
watch(query, () => (cascadeFrom.value = 0))
// A still shows once it's in, or once it won't come (the placeholder stays).
const arrived = (event: Event) => ((event.target as HTMLElement).dataset.loaded = '')
function lift(element: Element) {
  const item = element as HTMLElement
  const { offsetLeft, offsetTop, offsetWidth } = item
  Object.assign(item.style, { position: 'absolute', left: `${offsetLeft}px`, top: `${offsetTop}px`, width: `${offsetWidth}px` })
}

const still = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
</script>

<template>
  <div class="list">
    <div v-if="row.kind === 'playlist' && items.length > 4" class="list__tools" :class="{ 'list__tools--pinned': pinned }">
      <div class="list__orders" role="group" :aria-label="t('media.guide.sort.label')">
        <button v-for="by in orders" :key="by" type="button" :aria-pressed="order === by" @click="order = by">
          {{ t(`media.guide.sort.${by}`) }}
        </button>
      </div>
      <input v-if="big" v-model="query" class="list__find" type="search" :aria-label="t('media.guide.find')"
        :placeholder="t('media.guide.find')">
    </div>
    <TransitionGroup tag="ol" name="list" class="list__items" list-none p="0" m="0" appear @before-leave="lift">
      <li v-for="(item, i) in shown" :key="item.release.id" :style="{ '--i': Math.max(0, i - cascadeFrom) }">
        <a :href="item.release.url" class="list__item" @click="emit('pick', $event, item)">
          <img v-if="row.kind === 'playlist'" class="list__thumb" :src="still(item.release.id)" alt="" width="160"
            height="90" loading="lazy" @load="arrived" @error="arrived">
          <span class="list__title">{{ item.release.title }}</span>
          <GuideFigures class="list__meta" text="sm" :figures="item.figures" />
        </a>
      </li>
    </TransitionGroup>
    <p v-if="!found.length" m="0" text="sm muted">{{ t('media.guide.none') }}</p>
    <p v-else-if="shown.length < found.length" m="0" text="sm">
      <button type="button" class="list__more" @click="showAll">
        {{ t('media.guide.showAll', { count: n(found.length) }) }}
      </button>
    </p>
    <p m="0" text="sm">
      <NuxtLinkLocale v-if="row.project" :to="`/projects/${row.project}`" class="list__project">{{ row.project }}
      </NuxtLinkLocale>
      <a :href="row.url">{{ t(row.kind === 'podcast' ? 'media.guide.openPodcast' : 'media.guide.openPlaylist') }}
        ↗</a>
    </p>
  </div>
</template>

<style scoped>
.list {
  display: grid;
  gap: var(--gap-group);
}

.list__tools {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-group);
  align-items: baseline;
  justify-content: space-between;
}

/* In a sheet the sort and the search ride at the top while the list scrolls
   under them, on the sheet's own ground. */
.list__tools--pinned {
  position: sticky;
  inset-block-start: 0;
  z-index: 1;
  padding-block: var(--gap-tight);
  background: var(--bg);
  box-shadow: 0 1px 0 color-mix(in oklab, var(--fg) 10%, transparent);
}

.list__orders {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-group);
}

.list__orders button,
.list__more {
  all: unset;
  cursor: pointer;
  font-size: 0.875rem;
  text-underline-offset: 0.25em;
}

.list__orders button {
  color: var(--muted);
}

.list__orders button[aria-pressed='true'] {
  color: inherit;
  text-decoration: underline;
}

.list__orders button:hover,
.list__more:hover {
  text-decoration: underline;
}

/* A finger needs more to aim at than a mouse. */
@media (pointer: coarse) {
  .list__orders button {
    padding-block: 0.6rem;
  }
}

.list__orders button:focus-visible,
.list__more:focus-visible,
.list__find:focus-visible,
.list__item:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}

.list__find {
  all: unset;
  box-sizing: border-box;
  inline-size: min(100%, 16rem);
  padding-block: 0.2rem;
  border-block-end: 1px solid color-mix(in oklab, currentColor 40%, transparent);
  font-size: 0.875rem;
  caret-color: currentColor;
}

/* Under 16px a phone zooms the page in on focus. */
@media (pointer: coarse) {
  .list__find {
    inline-size: 100%;
    font-size: 1rem;
  }
}

.list__find::placeholder {
  color: var(--muted);
}

.list__find::selection {
  background: color-mix(in oklab, currentColor 30%, transparent);
}

.list__items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: var(--gap-block) var(--gap-group);
}

/*
 * The cascade: each item rises in a beat after the one before (--i counts
 * from the first new one), capped so a long list doesn't keep you waiting.
 * Moves glide; what leaves fades in place. Without motion all of it is
 * instant, and Vue skips the classes.
 */
.list__items {
  position: relative;
}

@media (prefers-reduced-motion: no-preference) {
  .list-enter-active {
    transition: opacity 0.5s var(--ease-out), translate 0.6s var(--ease-out);
    transition-delay: min(calc(var(--i, 0) * 40ms), 480ms);
  }

  .list-enter-from {
    opacity: 0;
    translate: 0 var(--space-4);
  }

  .list-leave-active {
    transition: opacity 0.2s var(--ease-out);
  }

  .list-leave-to {
    opacity: 0;
  }

  .list-move {
    transition: transform 0.55s var(--ease-out);
  }

  /* A still fades up over its placeholder as it arrives, rather than popping. */
  .list__thumb:not([data-loaded]) {
    opacity: 0;
  }
}

.list__item {
  display: grid;
  gap: 0.4rem;
  align-content: start;
  font-size: 0.875rem;
  text-decoration: none;
}

.list__thumb {
  display: block;
  inline-size: 100%;
  block-size: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: color-mix(in oklab, var(--fg) 12%, transparent);
}

.list__title {
  text-wrap: balance;
}

.list__item:hover .list__title {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

/* A press answers the moment the finger lands: the still sinks a little and
   dims, the words dim, and they come back as it lifts. */
.list__thumb,
.list__title,
.list__orders button,
.list__more,
.list__project,
.list > p:last-child a {
  transition: scale 0.25s var(--ease-out), filter 0.25s var(--ease-out), opacity 0.25s var(--ease-out);
}

.list__item:active .list__thumb {
  scale: 0.97;
  filter: brightness(0.8);
  transition-duration: 0s;
}

.list__item:active .list__title,
.list__orders button:active,
.list__more:active,
.list__project:active,
.list > p:last-child a:active {
  opacity: 0.55;
  transition-duration: 0s;
}

@media (prefers-reduced-motion: reduce) {
  .list__item:active .list__thumb {
    scale: none;
  }
}

/* Under a title, every figure is quiet: the title is the one bright line. */
.list__meta,
.list__meta :deep(.figure__value) {
  color: var(--muted);
}

.list__project {
  margin-inline-end: var(--gap-group);
  font-family: var(--font-heading);
  font-variation-settings: 'CASL' var(--heading-casual);
}
</style>
