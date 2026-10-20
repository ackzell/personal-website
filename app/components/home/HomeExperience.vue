<script setup lang="ts">
/**
 * Experience as a band of fields, like the flag band in the header but
 * standing up: one field per role, newest on top, each as tall as the time
 * spent there. The heading sticks under the header, and the band sticks under
 * the heading, beside the roles as they scroll by.
 *
 * The field of the role being read lights up: the one under the pointer or
 * focus, otherwise the one passing the upper part of the viewport. The other
 * roles step back, as lexicon entries do, so the lit role reads alone. The lit field fills
 * with the accent from the top; every field keeps its share of the career.
 *
 * Roles and fields are both links to the role: following one brings the role
 * to the top, under the heading.
 *
 * The band draws itself in once, top to bottom, the first time it scrolls
 * into view. Server-rendered fields are already full, so without JS (or when
 * the band is already on screen) nothing waits on the animation.
 */
const props = defineProps<{ title: string, roles: Role[] }>()

const { locale } = useI18n()

const heading = useTemplateRef<HTMLElement>('heading')
const band = useTemplateRef<HTMLElement>('band')
const entries = useTemplateRef<HTMLElement[]>('entries')

const hovered = ref<string>()
const reading = ref<string>()
const lit = computed(() => hovered.value ?? reading.value)
// pending: hidden, waiting to scroll in. drawn: fields grown to full.
const state = ref<'drawn' | 'pending'>('drawn')

const { height: headingHeight } = useElementSize(heading, undefined, { box: 'border-box' })

const lastYear = computed(() => props.roles[0]?.end.slice(0, 4))
const firstYear = computed(() => props.roles.at(-1)?.start.slice(0, 4))

const monthFormat = computed(() => new Intl.DateTimeFormat(locale.value, { month: 'short', year: 'numeric', timeZone: 'UTC' }))

function formatMonth(month: string) {
  const [year, m] = month.split('-').map(Number)
  return monthFormat.value.format(new Date(Date.UTC(year!, m! - 1)))
}

// While a followed link scrolls to its role, the target stays lit instead of
// every role the scroll passes on the way. Released once scrolling settles
// (debounced scroll, since scrollend isn't everywhere yet).
const travelling = ref(false)
const arrive = useDebounceFn(() => {
  travelling.value = false
}, 150)
useEventListener('scroll', () => {
  if (travelling.value) arrive()
}, { passive: true })

// The role crossing a thin line a third of the way down the viewport.
useIntersectionObserver(entries, (records) => {
  if (travelling.value) return
  for (const record of records) {
    if (record.isIntersecting) reading.value = (record.target as HTMLElement).dataset.slug
  }
}, { rootMargin: '-33% 0px -66% 0px' })

onMounted(() => {
  const el = band.value
  if (!el) return
  if (el.getBoundingClientRect().top < window.innerHeight) return
  state.value = 'pending'
  const { stop } = useIntersectionObserver(el, ([record]) => {
    if (!record?.isIntersecting) return
    state.value = 'drawn'
    stop()
  }, { threshold: 0.25 })
})

const reducedMotion = usePreferredReducedMotion()

/* Bring a role to the top, just under the sticky heading (its scroll margin),
   and keep the hash so the role can be linked to. */
function go(event: MouseEvent, slug: string) {
  const el = document.getElementById(`role-${slug}`)
  if (!el) return
  event.preventDefault()
  reading.value = slug
  travelling.value = true
  // Already in place: no scroll comes to release it.
  arrive()
  el.scrollIntoView({ block: 'start', behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth' })
  history.replaceState(history.state, '', `#role-${slug}`)
}

function leave(slug: string) {
  if (hovered.value === slug) hovered.value = undefined
}
</script>

<template>
  <div class="experience" :style="{ '--heading-height': `${headingHeight}px` }">
    <h2 id="timeline-heading" ref="heading" class="experience__heading" m="0" py="group" bg="bg">{{ title }}</h2>

    <div class="experience__body" grid gap="x-block">
      <div class="experience__rail" aria-hidden="true" flex="~ col" items="center" gap="tight" typeset="code"
        text="sm muted">
        <span class="tabular-nums">{{ lastYear }}</span>
        <div ref="band" class="experience__band" :data-state="state" flex="~ col 1">
          <!-- Pointer shortcuts to the roles' own links, so kept out of the tab
               order and the accessibility tree. -->
          <a v-for="(role, i) in roles" :key="role.slug" :href="`#role-${role.slug}`" tabindex="-1"
            class="experience__field" :class="{ 'is-lit': lit === role.slug }"
            :style="{ '--months': role.months, '--i': i }" @click="go($event, role.slug)"
            @pointerenter="hovered = role.slug" @pointerleave="leave(role.slug)" />
        </div>
        <span class="tabular-nums">{{ firstYear }}</span>
      </div>

      <ol class="experience__list" m="0" p="0" list="none">
        <li v-for="role in roles" :id="`role-${role.slug}`" ref="entries" :key="role.slug" :data-slug="role.slug"
          class="experience__entry" :class="{ 'is-lit': lit === role.slug }" relative grid gap="x-group y-tight"
          pb="block" @pointerenter="hovered = role.slug" @pointerleave="leave(role.slug)" @focusin="hovered = role.slug"
          @focusout="leave(role.slug)">
          <p class="experience__dates tabular-nums" typeset="code" text="sm muted">
            <time :datetime="role.start">{{ formatMonth(role.start) }}</time>
            <span aria-hidden="true">&ensp;–&ensp;</span>
            <span class="sr-only">–</span>
            <time :datetime="role.end">{{ formatMonth(role.end) }}</time>
          </p>
          <div grid gap="tight">
            <h3 m="0">
              <a :href="`#role-${role.slug}`" class="experience__target text-fg decoration-none"
                @click="go($event, role.slug)">{{ role.role }}</a>
              <span text="muted" font="normal">·
                <a v-if="role.url" :href="role.url" class="experience__company" target="_blank" rel="noopener">{{
                  role.company }}</a>
                <template v-else>{{ role.company }}</template>
              </span>
            </h3>
            <p v-for="(line, i) in role.summary" :key="i" m="0">{{ line }}</p>
            <ul v-if="role.stack.length" class="experience__stack" flex flex-wrap gap="x-group y-1" m="0" mt="tight"
              p="0" list="none" typeset="code" text="sm muted">
              <li v-for="tool in role.stack" :key="tool">{{ tool }}</li>
            </ul>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.experience {
  /* Where the sticky header ends. On mobile the brand row tucks away and
     only the band stays (see main.css). */
  --stick-top: var(--header-height, 0px);
}

@media (width < 40rem) {
  .experience {
    --stick-top: calc(var(--header-height, 0px) - var(--header-tuck, 0px));
  }
}

/* The heading carries the stage color so roles scroll under it, as they do
   under the header. */
.experience__heading {
  position: sticky;
  top: var(--stick-top);
  z-index: 1;
}

.experience__body {
  grid-template-columns: auto minmax(0, 1fr);
}

/* The rail sticks just under the heading and fills what's left of the
   viewport above the footer, up to a comfortable reading height. */
.experience__rail {
  position: sticky;
  top: calc(var(--stick-top) + var(--heading-height, 0px));
  align-self: start;
  block-size: min(32rem, calc(100svh - var(--stick-top) - var(--heading-height, 0px) - var(--footer-height, 0px) - var(--gap-block)));
}

/* Same build as the flag band: bars with the stage showing between them. */
.experience__band {
  gap: var(--space-1);
  inline-size: var(--space-1);
}

.experience__field {
  position: relative;
  flex: var(--months) 1 0;
  min-block-size: var(--space-2);
  background-color: var(--line);
  transform-origin: top;
  transition:
    scale 700ms var(--ease-out) calc(var(--i) * 90ms);
}

/* A wider hit area than the 4px bar. Fields touch through it, so the pointer
   never falls between two of them. */
.experience__field::before {
  content: '';
  position: absolute;
  inset: calc(-0.5 * var(--space-1)) calc(-1 * var(--space-3));
}

/* Lighting fills the field with the accent from the top, as the flag band's
   marker fills a field; the field itself keeps its share of the career.
   Emptying is quicker than filling. */
.experience__field::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: var(--accent);
  transform-origin: top;
  scale: 1 0;
  transition: scale 250ms var(--ease-out);
}

.experience__field.is-lit::after {
  scale: 1 1;
  transition-duration: 500ms;
}

/*
 * The lit field glows like a neon tube. Glow is light, so it's built like
 * light: a core hotter than the accent, then halos of growing radius and
 * falling strength (the bloom falloff), added onto the stage with
 * plus-lighter instead of painted over it. It comes on steady: a strike
 * flicker read as dizzying, so the light just moves.
 */
.experience__field.is-lit::after {
  background-color: color-mix(in oklab, var(--accent), white 45%);
  border: 1px solid var(--accent);
  box-shadow: 0 0 1px color-mix(in oklab, var(--accent) 90%, transparent),
    0 0 4px color-mix(in oklab, var(--accent) 70%, transparent),
    0 0 10px color-mix(in oklab, var(--accent) 45%, transparent),
    0 0 24px color-mix(in oklab, var(--accent) 25%, transparent),
    0 0 56px color-mix(in oklab, var(--accent) 12%, transparent);
  mix-blend-mode: plus-lighter;
}

.experience__band[data-state='pending'] .experience__field {
  scale: 1 0;
  transition: none;
}

.experience__entry {
  scroll-margin-top: var(--heading-height, 0px);
  transition: opacity 250ms var(--ease-out);
  /* Keeps the company link's z-index inside its entry, so it scrolls under
     the sticky heading like the rest of the role. */
  isolation: isolate;
}

/* The role's link covers its whole entry, so the entry is one target; the
   company link sits above it. */
.experience__target::after {
  content: '';
  position: absolute;
  inset: 0;
}

.experience__company {
  position: relative;
  z-index: 1;
}

@media (width >=48rem) {
  .experience__entry {
    grid-template-columns: 12ch minmax(0, 1fr);
  }

  /* Dates sit on the role's line, not the block's top edge. */
  .experience__dates {
    padding-block-start: 0.15em;
  }
}

/* Spotlight, as in the lexicon, on the role lit in the band: pointed at,
   focused, or being read. Until one is lit (or without JS) all stay full. */
.experience__list:has(.is-lit) .experience__entry:not(.is-lit) {
  opacity: 0.4;
}

@media (prefers-reduced-motion: reduce) {

  /* The band still fills in, as a fade, without growing. */
  .experience__field {
    transition:
      opacity 200ms var(--ease-out),
      background-color 150ms var(--ease-out);
  }

  /* The fill fades in place instead of running down the field. */
  .experience__field::after,
  .experience__field.is-lit::after {
    scale: 1 1;
    opacity: 0;
    transition: opacity 150ms var(--ease-out);
  }

  .experience__field.is-lit::after {
    opacity: 1;
  }

  .experience__band[data-state='pending'] .experience__field {
    scale: none;
    opacity: 0;
  }
}
</style>
