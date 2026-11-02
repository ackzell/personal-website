<script setup lang="ts">
import { mainNav } from '~/config/nav'

/**
 * Main navigation as a band of flag fields, in section order (about · work ·
 * media). The current section's field opens and splits into its children:
 * the project words on work (so the band doubles as the scrubber between
 * projects), videos and podcast on media.
 * A marker sits on the current page and slides to the next one with the page
 * transition (see "marker" in assets/css/main.css).
 *
 * Underneath it's a plain list of links, so it works without JS. Below `sm`
 * the closed sections fold to stubs at their natural width and the open one
 * takes the rest, its children scrolling sideways inside its own field.
 */
const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const section = useSection()
// Same key as the work pages' own query, so they share one payload.
const { data: projects } = useProjects()

type Current = 'page' | 'true' | undefined
interface Stop {
  key: string
  to: string
  label: string
  lang?: string
  current: Current
  /** A page under the section, set a step down from the section's own link. */
  child?: boolean
}

const stripSlash = (path: string) => (path.length > 1 ? path.replace(/\/$/, '') : path)
const isPage = (to: string) => stripSlash(route.path) === stripSlash(localePath(to))
/** "page" on the page itself, "true" on a page under it (a project's part). */
const currentAt = (to: string): Current =>
  isPage(to) ? 'page' : stripSlash(route.path).startsWith(`${stripSlash(localePath(to))}/`) ? 'true' : undefined

const segments = computed(() =>
  mainNav.map((item) => {
    const open = section.value === item.section
    /**
     * "page" on the item's own page, "true" anywhere else in its section
     * (e.g. a project detail page, or /videos under Media).
     */
    const current: Current = isPage(item.to) ? 'page' : open ? 'true' : undefined
    const stops: Stop[] = [{ key: item.key, to: item.to, label: t(`nav.${item.key}`), current }]

    if (open && item.section === 'work') {
      for (const project of projects.value ?? []) {
        const to = `/projects/${project.slug}`
        stops.push({ key: project.slug, to, label: project.word, lang: 'nah', current: currentAt(to), child: true })
      }
    }
    if (open && 'children' in item) {
      for (const child of item.children) {
        stops.push({ key: child.key, to: child.to, label: t(`${child.key}.title`), current: isPage(child.to) ? 'page' : undefined, child: true })
      }
    }

    // The marker marks the page itself when it's on the band, then the child
    // it sits under (a project's part), otherwise the section (e.g. /videos).
    const marked = stops.find((stop) => stop.current === 'page')
      ?? stops.find((stop) => stop.child && stop.current)
      ?? (current && stops.length === 1 ? stops[0] : undefined)

    return { ...item, open, stops, marked: marked?.key }
  }),
)

const nav = useTemplateRef<HTMLElement>('nav')

/* Arrow keys scrub along the visible links; Tab still
   reaches every link. */
const moves: Record<string, (i: number, last: number) => number> = {
  ArrowLeft: (i) => i - 1,
  ArrowRight: (i) => i + 1,
  Home: () => 0,
  End: (_, last) => last,
}

function onKeydown(event: KeyboardEvent) {
  const move = moves[event.key]
  if (!move || !nav.value) return
  const links = [...nav.value.querySelectorAll<HTMLAnchorElement>('a')].filter((link) => link.checkVisibility())
  const i = links.indexOf(document.activeElement as HTMLAnchorElement)
  if (i === -1) return
  event.preventDefault()
  links[Math.min(Math.max(move(i, links.length - 1), 0), links.length - 1)]?.focus()
}

/*
 * When the open section's stops don't fit they scroll sideways: they fade out
 * at whichever edge has more to scroll to, and keep the current page in view.
 * scrollLeft, not scrollIntoView: the latter would also scroll the page under
 * the sticky header. When they fit, both are no-ops.
 *
 * The stops list comes and goes with the open section (v-if), so it's found
 * again after each render; the scroll tracking follows it.
 */
const stopsList = shallowRef<HTMLElement | null>(null)
const findStops = () => (stopsList.value = nav.value?.querySelector<HTMLElement>('.flag-nav__stops') ?? null)
watch(segments, findStops, { flush: 'post' })

const { arrivedState, measure } = useScroll(stopsList, { offset: { left: 1 } })

function showCurrent() {
  const list = stopsList.value
  if (!list) return
  // On the section's own page nothing in the list is current: back to the start.
  const current = list.querySelector<HTMLElement>('[aria-current]')?.parentElement
  if (!current) list.scrollLeft = 0
  else {
    // Measured against the list itself: offsetLeft would count from the
    // nearest positioned ancestor, past the section's link.
    const box = list.getBoundingClientRect()
    const item = current.getBoundingClientRect()
    list.scrollLeft += item.left - box.left - (box.width - item.width) / 2
  }
  measure()
}

watch(() => route.fullPath, () => {
  fingered = false
  passed = -1
  nextTick(showCurrent)
})
// Opening a section mounts its list after the route has changed.
watch(stopsList, showCurrent, { flush: 'post' })

// Submenu labels: when they show, and where their ripple starts.
const { reveal, rippleOrigin } = useSubmenuReveal({
  submenu: () => stopsList.value,
  isSectionPage: () => mainNav.some((item) => isPage(item.to)),
  // Among the children only: the section's link isn't in the submenu list.
  currentIndex: () => segments.value.find((segment) => segment.open)?.stops.slice(1).findIndex((stop) => stop.current) ?? -1,
})

// Mouse users drag the stops sideways, as touch already scrolls them.
useDragScroll(nav, '.flag-nav__stops')

/*
 * A finger running the stops sideways feels each one go by, as it passes the
 * list's start edge (where they snap). Only once a finger has been on the
 * list: keeping the current page in view (showCurrent) scrolls it too.
 */
let fingered = false
let passed = -1
useEventListener(stopsList, 'touchstart', () => (fingered = true), { passive: true })
useEventListener(stopsList, 'scroll', () => {
  const list = stopsList.value
  if (!list) return
  const edge = list.getBoundingClientRect().left
  const now = [...list.children].filter((item) => {
    const { left, right } = item.getBoundingClientRect()
    return (left + right) / 2 < edge
  }).length
  if (fingered && passed !== -1 && now !== passed) haptic('tick')
  passed = now
}, { passive: true })

// A tap that goes somewhere is felt; the page already shown goes nowhere.
function tap(to: string) {
  if (!isPage(to)) haptic('go')
}

// The words lean in where they're pressed (utils/pressLean).
const lean = (event: PointerEvent) => pressLean(event, '.flag-nav__text')

// The band resizes with the window, so whether the stops overflow can change
// without a scroll.
useResizeObserver(nav, measure)

/*
 * On a full load the light runs along the band once, field by field, left to
 * right, and leaves the marker lit. Not on in-app navigation, and not under
 * reduced motion. Each field's ::before carries the light (see the styles).
 */
const fullLoad = import.meta.client && useNuxtApp().isHydrating

function ignite() {
  if (!fullLoad || !nav.value || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const fields = [...nav.value.querySelectorAll<HTMLElement>('.flag-nav__field')].filter((field) => field.checkVisibility())
  // Under a second end to end, however many fields there are.
  const step = Math.min(110, 900 / fields.length)
  fields.forEach((field, n) => {
    field.animate({ opacity: [0, 1, 0], offset: [0, 0.25, 1] }, {
      pseudoElement: '::before',
      duration: 450,
      delay: n * step,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    })
  })
}

onMounted(() => {
  findStops()
  showCurrent()
  ignite()
})
</script>

<template>
  <nav ref="nav" class="flag-nav" flex="~ col" :aria-label="$t('nav.label')" @keydown="onKeydown">
    <ul class="flag-nav__band" flex gap="1" m="0" p="0" list="none">
      <li v-for="segment in segments" :key="segment.key" class="flag-nav__segment data-[open=true]:flex-1" flex="~ none"
        gap="0.5" min-w="28" :data-section="segment.section" :data-open="segment.open" :data-split="segment.stops.length > 1"
        :style="{ '--field': `var(--field-${segment.section})` }">
        <!-- Label hierarchy through brightness and size, not hue: section
             labels (About, Work, Media) are full brightness and a step
             larger; their children (project words, videos, podcast) are
             smaller and dimmed until current or hovered.
             The section's own link sits outside the children's scroller, so
             it stays in view however far they scroll. -->
        <NuxtLinkLocale :to="segment.to" :aria-current="segment.stops[0]!.current" data-press="none" @click="tap(segment.to)"
          @pointerdown="lean" @pointermove="lean"
          class="flag-nav__link text-[1rem] text-fg leading-[1.4] whitespace-nowrap transition-[color] duration-150 ease-[ease]"
          flex flex-col gap="2" pb="1" min-w="28" decoration="none">
          <span class="flag-nav__field" relative block aria-hidden="true">
            <!-- One per page; the name lets the page transition slide it (main.css). -->
            <span v-if="segment.marked === segment.key" class="flag-nav__marker [view-transition-name:flag-marker]"
              absolute inset="0" bg="accent" />
          </span>
          <span pe="3"><span class="flag-nav__text">{{ segment.stops[0]!.label }}</span></span>
        </NuxtLinkLocale>
        <ul v-if="segment.stops.length > 1" class="flag-nav__stops" flex gap="0.5" m="0" p="0" list="none"
          :aria-label="segment.stops[0]!.label" :data-reveal="reveal || undefined"
          :data-fade-start="!arrivedState.left || undefined" :data-fade-end="!arrivedState.right || undefined"
          :style="{ '--children': segment.stops.length - 1 }">
          <li v-for="(stop, i) in segment.stops.slice(1)" :key="stop.key" class="flag-nav__stop" flex="auto" data-child
            :style="{ '--ripple': Math.abs(i - rippleOrigin) }">
            <NuxtLinkLocale :to="stop.to" :aria-current="stop.current" :lang="stop.lang" data-child data-press="none" @click="tap(stop.to)"
              @pointerdown="lean" @pointermove="lean"
              class="flag-nav__link text-[0.75rem] text-[var(--nav-child)] leading-[1.4] whitespace-nowrap transition-[color] duration-150 ease-[ease] hover:text-[var(--nav-child-on)] current:text-[var(--nav-child-on)] current:font-bold"
              flex flex-col gap="2" pb="1" decoration="none">
              <span class="flag-nav__field" relative block aria-hidden="true">
                <span v-if="segment.marked === stop.key" class="flag-nav__marker [view-transition-name:flag-marker]"
                  absolute inset="0" bg="accent" />
              </span>
              <span class="flag-nav__label" pe="3"><span class="flag-nav__text">{{ stop.label }}</span></span>
            </NuxtLinkLocale>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
/*
 * Fields: a faint track for the marker to ride on, the same for every
 * section, so color only shows where you are (the open section's label and
 * the marker). The open section's children's fields are fainter still.
 * Closed fields are half as thick, so a paper field never reads as the
 * (paper) marker on the green and red stages.
 * No borders: the stage shows through the gaps.
 */
.flag-nav {
  --field-height: var(--space-1);
  /* Dimmer than fg for children, but brighter than --muted, which drops
     under 4.5:1 for small text on the red stage. */
  --nav-muted: color-mix(in srgb, var(--fg) 85%, var(--bg));
}

/*
 * Children are tinted toward their section's flag: the field is distinct
 * from the stage in both schemes, so it mixes in directly. Work (ink, or
 * paper in dark) barely moves. Current or hovered: a step stronger.
 */
.flag-nav__segment {
  --nav-child: color-mix(in srgb, var(--field) 40%, var(--nav-muted));
  --nav-child-on: color-mix(in srgb, var(--field) 40%, var(--fg));
}

.flag-nav__field {
  block-size: calc(var(--field-height) / 2);
  margin-block-start: calc(var(--field-height) / 2);
  background: var(--line);
}

[data-open='true'] .flag-nav__field {
  block-size: var(--field-height);
  margin-block-start: 0;
  background: var(--line);
}

[data-open='true'] [data-child] .flag-nav__field {
  background: color-mix(in srgb, var(--fg) 12%, var(--bg));
}

/* A section with no stops of its own (about): its link fills the open field,
   so the marker does too. */
.flag-nav__segment[data-split='false']>.flag-nav__link {
  flex: 1;
}

/* With children, the section's link and each child share the spare width
   alike, as if they were one list. */
.flag-nav__segment[data-split='true']>.flag-nav__link {
  flex: 1 0 auto;
}

.flag-nav__segment>.flag-nav__stops {
  flex: var(--children) 1 auto;
  min-inline-size: 0;
}

/*
 * Hover and keyboard focus preview the move: a faint marker fills the field
 * from the left, the way the real one would arrive. Pressing firms it up.
 * Not on the current page, where the marker already sits.
 */
.flag-nav__field::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent);
  opacity: 0.35;
  transform: scaleX(0);
  transform-origin: left;
  transition:
    transform 200ms var(--ease-out),
    opacity 100ms ease;
}

.flag-nav__link:focus-visible .flag-nav__field::after {
  transform: scaleX(1);
}

@media (hover: hover) and (pointer: fine) {
  .flag-nav__link:hover .flag-nav__field::after {
    transform: scaleX(1);
  }
}

.flag-nav__link:active .flag-nav__field::after {
  opacity: 0.6;
}

/* Pressed, the label gives under the finger as the marker firms up: the
   words lean in where they're pressed, the near end going in and the far
   end coming up, like a key pressed off center (--press-x, set by lean()),
   and settle flat as it lifts. The site's press (main.css) without the dim,
   the marker being the answer; only the words, so the band stays whole. */
.flag-nav__text {
  display: inline-block;
  transition: transform 0.25s var(--ease-out);
}

.flag-nav__link:active .flag-nav__text {
  transform: perspective(8em) rotateY(calc(var(--press-x, 0) * 14deg)) scale(0.97);
  transition-duration: 80ms;
}

.flag-nav__link[aria-current='page'] .flag-nav__field::after,
.flag-nav__link[data-child][aria-current] .flag-nav__field::after {
  display: none;
}

/* The light that runs along the band on a full load (ignite). Plain accent
   on light's paper, for the same reason as the marker below. */
.flag-nav__field::before {
  content: '';
  position: absolute;
  inset: 0;
  background-color: var(--accent);
  opacity: 0;
  pointer-events: none;
}

:root.dark .flag-nav__field::before {
  background-color: var(--hot);
  box-shadow: var(--glow-near);
  mix-blend-mode: plus-lighter;
}

/* The marker is lit: you are here. It glows like the experience band's lit
   field (--glow-near, see main.css); a preview stays faint and unlit. Light
   adds onto a darker stage, so not for the marker on light's paper, where it
   would wash out. */
:root.dark .flag-nav__marker {
  background-color: var(--hot);
  box-shadow: var(--glow-near);
  mix-blend-mode: plus-lighter;
}

/*
 * The open section's stops scroll sideways when they don't fit (always on
 * small screens, and between sm and a wide window when there are many
 * projects), fading out at whichever edge has more to scroll to. When they
 * fit, none of this shows.
 */
.flag-nav__stops {
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  /* Room for the marker's glow above the fields, which the scroll box
     would otherwise clip. */
  padding-block-start: var(--space-3);
  margin-block-start: calc(-1 * var(--space-3));
  --fade: var(--space-8);
  mask-image: linear-gradient(to right,
      transparent,
      #000 var(--fade-start, 0px),
      #000 calc(100% - var(--fade-end, 0px)),
      transparent);
}

.flag-nav__stops[data-dragging] {
  scroll-snap-type: none;
  cursor: grabbing;
  user-select: none;
}

.flag-nav__stops[data-dragging] .flag-nav__link {
  cursor: grabbing;
}

.flag-nav__stops::-webkit-scrollbar {
  display: none;
}

.flag-nav__stops[data-fade-start] {
  --fade-start: var(--fade);
}

.flag-nav__stops[data-fade-end] {
  --fade-end: var(--fade);
}

/* Grow to fill a short list (media), never shrink below the label. */
.flag-nav__stop {
  flex: 1 0 auto;
  scroll-snap-align: start;
}

/*
 * Below sm the flag folds: closed sections shrink to stubs at their label's
 * width, the open one takes the rest of the band and holds its children,
 * scrolling sideways when they don't fit. One row, so a child always sits
 * inside its parent's field. Pure CSS, so the server render and no-JS match.
 */
@media (width < 40rem) {
  .flag-nav__segment {
    min-inline-size: 0;
  }

  .flag-nav__segment[data-open='true'] {
    flex: 1;
  }

  .flag-nav__segment>.flag-nav__link {
    min-inline-size: 0;
  }

  /* The section's link keeps its label's width; its children scroll in
     what's left. */
  .flag-nav__segment[data-split='true']>.flag-nav__link {
    flex: none;
  }

  /* Closed sections step back to plain, dimmed labels: their fields already
     carry the flag colors. */
  .flag-nav__segment:not([data-open='true']) .flag-nav__link {
    color: var(--nav-muted);
  }

  /* Section labels share one size, so the open one doesn't grow down out of
     line with the rest; weight marks it instead. */
  .flag-nav__link:not([data-child]) {
    font-size: 0.75rem;
  }

  .flag-nav__segment[data-open='true'] .flag-nav__link:not([data-child]) {
    font-weight: 700;
  }

  .flag-nav__link {
    min-block-size: 2.75rem;
  }
}

/* The open section is named in its own flag color too, stronger than the
   closed ones. */
@media (width < 40rem) {
  .flag-nav__segment[data-open='true'] .flag-nav__link:not([data-child]) {
    color: color-mix(in srgb, var(--field) 85%, var(--fg));
  }
}

/*
 * Submenu labels reveal: at rest the open section shows its children as
 * fields only, plus the current page's label so you still know where you
 * are. When the pointer comes within range (data-reveal, set by the script),
 * the labels ripple in from the stop nearest it, one step per 30ms; keyboard
 * focus reveals them too (focus-visible, so a click doesn't hold them open).
 * They leave together, faster. Picking a child page hides the rest until the
 * pointer leaves and returns; opening a section reveals its children. Pointer devices only: touch keeps them shown.
 */
@media (hover: hover) and (pointer: fine) and (width >=40rem) {
  .flag-nav__link[data-child]:not([aria-current]) .flag-nav__label {
    opacity: 0;
    translate: 0 -0.25rem;
    transition:
      opacity 150ms var(--ease-out),
      translate 150ms var(--ease-out);
  }

  .flag-nav__stops:is([data-reveal], :has(:focus-visible)) .flag-nav__link[data-child] .flag-nav__label {
    opacity: 1;
    translate: 0 0;
    transition-duration: 200ms;
    transition-delay: calc(var(--ripple) * 60ms);
  }
}

@media (prefers-reduced-motion: reduce) {

  /* Labels still reveal, as a plain fade: no drop, no stagger. */
  .flag-nav__label {
    translate: none !important;
    transition-delay: 0ms !important;
  }

  /* The preview still shows, it just fades in instead of filling. */
  .flag-nav__field::after {
    opacity: 0;
    transform: none;
    transition: opacity 150ms ease;
  }

  .flag-nav__link:focus-visible .flag-nav__field::after {
    opacity: 0.35;
  }

  @media (hover: hover) and (pointer: fine) {
    .flag-nav__link:hover .flag-nav__field::after {
      opacity: 0.35;
    }
  }

  .flag-nav__link:active .flag-nav__field::after {
    opacity: 0.6;
  }

  .flag-nav__link:active .flag-nav__text {
    transform: none;
  }
}
</style>
