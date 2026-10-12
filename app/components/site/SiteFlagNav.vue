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
 * Underneath it's a plain list of links: it works without JS, and below `sm`
 * the collapsed band only kicks in when scripting is on.
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
        stops.push({ key: project.slug, to, label: project.word, lang: 'nah', current: isPage(to) ? 'page' : undefined, child: true })
      }
    }
    if (open && 'children' in item) {
      for (const child of item.children) {
        stops.push({ key: child.key, to: child.to, label: t(`${child.key}.title`), current: isPage(child.to) ? 'page' : undefined, child: true })
      }
    }

    // The marker marks the page itself when it's on the band, otherwise the
    // section (e.g. /videos).
    const marked = stops.find((stop) => stop.current === 'page') ?? (current && stops.length === 1 ? stops[0] : undefined)

    return { ...item, open, stops, marked: marked?.key }
  }),
)

/* Arrow keys scrub along the band; Tab still reaches every link. */
const band = useTemplateRef<HTMLUListElement>('band')
const moves: Record<string, (i: number, last: number) => number> = {
  ArrowLeft: (i) => i - 1,
  ArrowRight: (i) => i + 1,
  Home: () => 0,
  End: (_, last) => last,
}

function onKeydown(event: KeyboardEvent) {
  const move = moves[event.key]
  if (!move || !band.value) return
  const links = [...band.value.querySelectorAll<HTMLAnchorElement>('a')]
  const i = links.indexOf(document.activeElement as HTMLAnchorElement)
  if (i === -1) return
  event.preventDefault()
  links[Math.min(Math.max(move(i, links.length - 1), 0), links.length - 1)]?.focus()
}

/*
 * Below `sm` the band collapses to its fields and the marker; the toggle opens
 * the full map. `compact` is only known after mount, so the server render and
 * no-JS visitors keep every link reachable.
 */
const open = ref(false)
const compact = ref(false)
const toggle = useTemplateRef<HTMLButtonElement>('toggle')

watch(() => route.fullPath, () => (open.value = false))

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !open.value) return
  open.value = false
  toggle.value?.focus()
}

// Submenu labels: when they show, and where their ripple starts.
const { reveal, rippleOrigin } = useSubmenuReveal({
  submenu: () => band.value?.querySelector<HTMLElement>('.flag-nav__stops'),
  isSectionPage: () => mainNav.some((item) => isPage(item.to)),
  currentIndex: () => segments.value.find((segment) => segment.open)?.stops.findIndex((stop) => stop.current === 'page') ?? -1,
})

let compactQuery: MediaQueryList | undefined
const syncCompact = () => (compact.value = compactQuery?.matches ?? false)

onMounted(() => {
  // Matches the `sm` breakpoint (40rem) used in the styles below.
  compactQuery = window.matchMedia('(width < 40rem)')
  syncCompact()
  compactQuery.addEventListener('change', syncCompact)
  document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  compactQuery?.removeEventListener('change', syncCompact)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <nav class="flag-nav" relative grid grid-cols="[minmax(0,1fr)_auto]" items="center" gap="x-group"
    :data-state="open ? 'open' : 'collapsed'" :aria-label="$t('nav.label')">
    <ul id="flag-nav-band" ref="band" class="flag-nav__band" flex gap="1" m="0" p="0" list="none"
      :inert="compact && !open" @keydown="onKeydown">
      <li v-for="segment in segments" :key="segment.key" class="flag-nav__segment data-[open=true]:flex-1" flex="none"
        min-w="28" :data-open="segment.open" :data-split="segment.stops.length > 1"
        :style="{ '--field': `var(--field-${segment.section})` }">
        <ul v-if="segment.stops.length > 1" class="flag-nav__stops" flex gap="0.5" m="0" p="0" list="none"
          :aria-label="segment.stops[0]!.label" :data-reveal="reveal || undefined">
          <li v-for="(stop, i) in segment.stops" :key="stop.key" flex="auto"
            :style="{ '--ripple': Math.abs(i - rippleOrigin) }">
            <!-- Label hierarchy through brightness and size, not hue: section
                 labels (About, Work, Media) are full brightness and a step
                 larger; their children (project words, videos, podcast) are
                 smaller and dimmed until current or hovered. -->
            <NuxtLinkLocale :to="stop.to" :aria-current="stop.current" :lang="stop.lang" :data-child="stop.child"
              class="flag-nav__link leading-[1.4] whitespace-nowrap transition-[color] duration-150 ease-[ease]"
              :class="stop.child ? 'text-[0.75rem] text-muted hover:text-fg current:text-fg' : 'text-[1rem] text-fg'"
              flex flex-col gap="2" pb="1" decoration="none">
              <span class="flag-nav__field" relative block aria-hidden="true">
                <span v-if="segment.marked === stop.key" class="[view-transition-name:flag-marker]" absolute inset="0"
                  bg="accent" />
              </span>
              <span class="flag-nav__label" pe="3">{{ stop.label }}</span>
            </NuxtLinkLocale>
          </li>
        </ul>
        <NuxtLinkLocale v-else :to="segment.to" :aria-current="segment.stops[0]!.current"
          class="flag-nav__link text-[1rem] text-fg leading-[1.4] whitespace-nowrap transition-[color] duration-150 ease-[ease]"
          flex flex-col gap="2" pb="1" min-w="28" decoration="none">
          <span class="flag-nav__field" relative block aria-hidden="true">
            <!-- One per page; the name lets the page transition slide it (main.css). -->
            <span v-if="segment.marked" class="[view-transition-name:flag-marker]" absolute inset="0" bg="accent" />
          </span>
          <span pe="3">{{ segment.stops[0]!.label }}</span>
        </NuxtLinkLocale>
      </li>
    </ul>
    <button ref="toggle" type="button"
      class="flag-nav__toggle hidden text-sm text-muted hover:text-fg aria-expanded:text-fg" col-start="2" row-start="1"
      items="center" gap="1" min-h="11" p="0" border="0" bg="transparent" font="inherit" cursor="pointer"
      aria-controls="flag-nav-band" :aria-expanded="open" @click="open = !open">
      {{ $t('nav.menu') }}
      <span class="flag-nav__chevron i-iconoir-nav-arrow-down" aria-hidden="true" />
    </button>
  </nav>
</template>

<style scoped>
/*
 * Fields: the closed sections show their flag color (--field-*, main.css).
 * The open one is the stage itself, so its field is only a faint track for
 * the marker to ride on, and its children's fields are fainter still.
 * Closed fields are half as thick, so a paper field never reads as the
 * (paper) marker on the green and red stages.
 * No borders: the stage shows through the gaps.
 */
.flag-nav {
  --field-height: var(--space-1);
}

.flag-nav__field {
  block-size: calc(var(--field-height) / 2);
  margin-block-start: calc(var(--field-height) / 2);
  background: var(--field);
}

[data-open='true'] .flag-nav__field {
  block-size: var(--field-height);
  margin-block-start: 0;
  background: var(--line);
}

[data-open='true'] [data-child] .flag-nav__field {
  background: color-mix(in srgb, var(--fg) 12%, var(--bg));
}

/* A section with no stops of its own (about, media): its link only spans its
   label, and the track runs on to the next field. */
.flag-nav__segment[data-open='true'][data-split='false'] {
  display: flex;
  background: linear-gradient(var(--line), var(--line)) top / 100% var(--field-height) no-repeat;
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

.flag-nav__link[aria-current='page'] .flag-nav__field::after {
  display: none;
}

.flag-nav__chevron {
  transition: rotate 200ms var(--ease-out);
}

[aria-expanded='true']>.flag-nav__chevron {
  rotate: 180deg;
}

/* Below sm, the map: segments stacked, project words wrapping. This is also
   the no-JS layout, so every link stays reachable. */
@media (width < 40rem) {
  .flag-nav__band {
    grid-column: 1 / -1;
    flex-direction: column;
    gap: var(--gap-group);
  }

  .flag-nav__stops {
    flex-wrap: wrap;
    row-gap: var(--gap-tight);
  }

  .flag-nav__link {
    min-block-size: 2.75rem;
  }
}

/* With JS, the map starts collapsed to the fields and your position. The
   toggle covers the whole band, so tapping the fields opens it too. */
@media (width < 40rem) and (scripting: enabled) {
  .flag-nav__toggle {
    display: inline-flex;
  }

  .flag-nav[data-state='open'] .flag-nav__band {
    grid-row: 2;
    padding-block: var(--gap-tight) var(--gap-group);
  }

  .flag-nav[data-state='collapsed'] {
    .flag-nav__band {
      grid-column: 1;
      flex-direction: row;
      gap: var(--space-1);
    }

    .flag-nav__segment {
      flex: 1;
      min-inline-size: 0;
    }

    .flag-nav__segment[data-open='true'] {
      flex: 3;
    }

    .flag-nav__stops {
      flex-wrap: nowrap;
    }

    .flag-nav__link {
      min-block-size: 0;
      min-inline-size: 0;
      padding: 0;
    }

    .flag-nav__segment[data-split='false']>.flag-nav__link {
      flex-basis: 40%;
    }

    .flag-nav__link> :last-child {
      display: none;
    }

    .flag-nav__toggle::before {
      content: '';
      position: absolute;
      inset: 0;
    }
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
  .flag-nav__link[data-child]:not([aria-current='page']) .flag-nav__label {
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

  .flag-nav__chevron {
    transition: none;
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
}
</style>
