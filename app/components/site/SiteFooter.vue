<script setup lang="ts">
import { socialLinks } from '~/config/nav'

/*
 * Sticky at the bottom, like the header at the top. Its height is published
 * as --footer-height so scroll-padding-bottom (main.css) keeps focused
 * content from landing under it. On small screens it becomes a rail on the
 * inline-end edge instead (main.css).
 */
usePublishedHeight(useTemplateRef<HTMLElement>('footer'), '--footer-height')

/*
 * Crossing the 40rem breakpoint moves the icons between the bottom bar and
 * the rail. By the time a resize event fires, layout already shows the new
 * place, so keep the positions from the previous event and, when the
 * breakpoint flips, play each icon in from there (FLIP), one after another.
 */
const items = useTemplateRef<HTMLElement[]>('items')
const reduceMotion = usePreferredReducedMotion()
let railQuery: MediaQueryList | undefined
let last: { rail: boolean; rects: DOMRect[] } | undefined

/*
 * Read the query directly, not through useMediaQuery: resize events run
 * before media query change events, so a reactive ref is still stale here.
 */
function measure() {
  return { rail: railQuery?.matches ?? false, rects: (items.value ?? []).map((el) => el.getBoundingClientRect()) }
}

onMounted(() => {
  railQuery = window.matchMedia('(width < 40rem)')
  last = measure()
})

useEventListener(
  'resize',
  () => {
    const next = measure()
    if (last && last.rail !== next.rail && reduceMotion.value !== 'reduce') {
      items.value?.forEach((el, i) => {
        const from = last!.rects[i]
        const to = next.rects[i]
        if (!from || !to) return
        // Carried in slightly raised, then lowered into the slot: it lands.
        el.animate(
          [
            { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)`, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
            { transform: 'translateY(-6px) scale(1.06)', offset: 0.6, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' },
            { transform: 'none' },
          ],
          {
            duration: 620,
            delay: i * 45,
            // Hold the old spot while waiting for its turn.
            fill: 'backwards',
          },
        )
      })
    }
    last = next
  },
  { passive: true },
)

/*
 * The dock wave for a finger: dragged along the icons, it follows the one
 * under it. A touch keeps reporting to the element it started on, so look up
 * what's under the finger instead of trusting the event's target.
 */
const touched = ref<number>()
let release: ReturnType<typeof setTimeout> | undefined
function follow(event: PointerEvent) {
  if (event.pointerType === 'mouse') return
  clearTimeout(release)
  const item = document.elementFromPoint(event.clientX, event.clientY)?.closest('li')
  const index = item ? (items.value ?? []).indexOf(item) : -1
  touched.value = index === -1 ? undefined : index
}
/*
 * A tap is over in a blink, quicker than the icon can grow, so hold the wave
 * a moment after the finger lifts: the tapped icon is seen standing up, then
 * settles (or the page leaves under it).
 */
function letGo(event: PointerEvent) {
  clearTimeout(release)
  release = setTimeout(() => (touched.value = undefined), event.type === 'pointercancel' ? 0 : 220)
}
onBeforeUnmount(() => clearTimeout(release))

/*
 * A social opens somewhere else (another window, tab or app), and the page is
 * left mid-press: the touch release may never come, and a clicked link keeps
 * focus, which holds the wave up (:focus-within) on the way back. So as the
 * page is left, and again as it's shown (also from the back-forward cache),
 * let the keys go. Focus stays when it's a keyboard's (:focus-visible), as
 * that's where a keyboard user is.
 */
const list = useTemplateRef<HTMLElement>('list')
function reset() {
  clearTimeout(release)
  touched.value = undefined
  const focused = document.activeElement
  if (focused instanceof HTMLElement && list.value?.contains(focused) && !focused.matches(':focus-visible')) focused.blur()
}
useEventListener(document, 'visibilitychange', reset)
useEventListener(window, 'blur', reset)
useEventListener(window, 'pageshow', reset)

/*
 * Each icon is a key with a note of its own; run along them, left to right,
 * and they play C♯ A C♯ D E G♯, the guitar line that opens In My Life (the
 * A a sixth above the first C♯). A finger plays each one it reaches (the
 * same tracking as the wave), a mouse each one it comes over.
 */
const NOTES = [277.18, 440, 277.18, 293.66, 329.63, 415.3]
const strike = (i: number) => soundNote(NOTES[i % NOTES.length]!)
// A finger feels each key go down as it hears it.
watch(touched, (i) => {
  if (i === undefined) return
  strike(i)
  haptic('key')
})
function enter(event: PointerEvent, i: number) {
  if (event.pointerType === 'mouse') strike(i)
}
// Built in (main.css, "First visit"), each icon plays its note as it lands,
// so the line is heard once: silent unless sound is on (`ackzell.intro`).
function landed(event: AnimationEvent, i: number) {
  if (event.animationName.startsWith('site-footer-intro')) strike(i)
}
</script>

<template>
  <!-- The stage color behind it, so the page scrolls under, not through. -->
  <footer ref="footer" class="site-footer" sticky bottom="0" z="10" bg="bg" px="track-wide" py="6" border="none"
    flex="~ wrap" items="center" gap="x-6 y-group">
    <SiteMarkLayer clipped />
    <!-- Icon-only links: the name lives in aria-label (screen readers) and
         title (hover). No gap: each link's padding is the spacing, so the
         30px touch targets (WCAG 2.2 asks for 24px) sit edge to edge while
         the icons stay 12px apart. The negative margin keeps them aligned.
         Icons sized in rem, off the em text scale, so phones keep the targets.
         In fg, like the switches, not the link accent: in dark, section
         color is kept for the band, where it marks where you are.
         data-press none: the shared key press shrank the link as a finger
         grew the icon; they press on their own, below. -->
    <ul ref="list" class="site-footer__links" flex="~ wrap" p="0" m="-1.5" list="none" @pointerdown="follow"
      @pointermove="follow" @pointerup="letGo" @pointercancel="letGo">
      <li v-for="(link, i) in socialLinks" :key="link.href" ref="items" :data-touched="touched === i || undefined"
        @pointerenter="enter($event, i)">
        <a :href="link.href" rel="me noopener" :aria-label="link.label" :title="link.label"
          class="text-[1.125rem] text-fg site-footer__land" data-press="none" :style="{ '--i': i }" inline-flex p="1.5"
          @animationend="landed($event, i)">
          <span :class="link.icon" aria-hidden="true" />
        </a>
      </li>
    </ul>
    <!-- The stops either side along the band, in reach from anywhere on a
         wide screen (below that they sit at the page's foot). -->
    <SiteNextStop bar class="site-footer__stops" />
    <!-- The header's lang="en" sits top right; its twin sits bottom right. -->
    <SiteSchemeSwitch ml="auto" class="site-footer__scheme" />
  </footer>
</template>

<style scoped>
/* Wide: the stops in the middle, the socials and the switch at either side. */
@media (width >=64rem) {
  .site-footer {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
  }

  .site-footer__stops {
    grid-column: 2;
  }

  .site-footer__scheme {
    grid-column: 3;
    justify-self: end;
  }
}

/*
 * Dock wave: the hovered icon grows most, its neighbors less, the next ones
 * a touch. Scale the icon, not the <li>, which the FLIP above animates.
 * The 12px between icons absorbs the growth, so nothing overlaps or reflows.
 */
.site-footer__links span {
  --wave: 1;
  --press: 1;
  --opacity: 1;
  display: block;
  transform: scale(calc(var(--wave) * var(--press)));
  transform-origin: bottom center;
  opacity: var(--opacity);
}

/* The rail grows inward, away from the screen edge. */
@media (width < 40rem) {
  .site-footer__links span {
    transform-origin: right center;
  }
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {

  /* Dimmed at rest; hover brings them back (a drag does on touch, below). */
  .site-footer__links span {
    --opacity: 0.25;
    transition:
      transform 260ms var(--ease-out),
      opacity 260ms var(--ease-out),
      filter 260ms var(--ease-out);
  }

  /* While the wave runs, icons outside it fade further. :where() keeps this
     at the resting rule's specificity, so the wave steps below still win. */
  .site-footer:has(:where(li:hover, li:focus-within)) span {
    --opacity: 0.1;
  }

  li:is(:hover, :focus-within) span {
    --wave: 1.5;
    --opacity: 1;
  }

  li:is(:hover, :focus-within)+li span,
  li:has(+ li:is(:hover, :focus-within)) span {
    --wave: 1.25;
    --opacity: 0.50;
  }

  li:is(:hover, :focus-within)+li+li span,
  li:has(+ li + li:is(:hover, :focus-within)) span {
    --wave: 1.1;
    --opacity: 0.25;
  }

}

/*
 * A mouse press: the grown icon gives a little under the click and dims, as
 * the shared key press does (main.css), pressing down at once and easing
 * back on release. Not for a finger: data-touched marks a touch, whose
 * answer is the wave, and a shrink under it fought the grow.
 */
.site-footer__links:not(:has([data-touched])) a:active span {
  --press: 0.88;
  filter: opacity(0.6);
  transition-duration: 0s;
}

@media (prefers-reduced-motion: reduce) {
  .site-footer__links:not(:has([data-touched])) a:active span {
    --press: 1;
  }
}

/*
 * Landing: on the first paint the icons come in one after another, rising
 * from the bottom edge (sliding in from the screen's edge on the rail), so
 * they arrive instead of just being there. On the link, not the icon, which
 * carries the wave, nor the <li>, which the FLIP moves.
 */
.site-footer__land {
  animation: site-footer-land 300ms var(--ease-out) calc(var(--i) * 50ms) backwards;
}

@keyframes site-footer-land {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@media (width < 40rem) {
  @keyframes site-footer-land {
    from {
      opacity: 0;
      transform: translateX(8px);
    }
  }
}

/* Fewer, gentler: they fade in where they are. */
@media (prefers-reduced-motion: reduce) {
  @keyframes site-footer-land {
    from {
      opacity: 0;
    }
  }
}

/*
 * On a first visit (main.css, "First visit") they land as they do crossing
 * the breakpoint (the FLIP above): carried in from the edge, raised, then
 * lowered into the slot, one after another as the footer comes up.
 */
:root[data-intro='build'] .site-footer__land {
  --land-from: 0, 2.5rem;
  animation: site-footer-intro 620ms calc(2400ms + var(--i) * 60ms) backwards;
}

/* Built: the everyday landing would otherwise start over once "build" is gone. */
:root[data-intro='done'] .site-footer__land {
  animation: none;
}

@media (width < 40rem) {
  :root[data-intro='build'] .site-footer__land {
    --land-from: var(--rail-width), 0;
  }
}

@keyframes site-footer-intro {
  from {
    opacity: 0;
    transform: translate(var(--land-from));
    animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  }

  60% {
    opacity: 1;
    transform: translateY(-6px) scale(1.06);
    animation-timing-function: cubic-bezier(0.45, 0, 0.2, 1);
  }
}

/* A drag along the icons is theirs, not the page's: on the rail it runs the
   same way as scrolling, and the page scrolls from anywhere else. */
.site-footer__links {
  touch-action: none;
  -webkit-touch-callout: none;
  user-select: none;
}

/*
 * The same wave for a finger (data-touched, set while dragging). Apart from
 * the hover rules: on touch, :hover sticks to the last tapped icon, so it
 * can't stand in for "under the finger now".
 */
@media (prefers-reduced-motion: no-preference) {

  /* Dimmed at rest, as with a mouse: a drag along them brings them back. */
  .site-footer__links span {
    --opacity: 0.25;
    transition:
      transform 260ms var(--ease-out),
      opacity 260ms var(--ease-out),
      filter 260ms var(--ease-out);
  }

  /* :where() keeps this below the wave steps, as with hover. */
  .site-footer__links:has(:where([data-touched])) span {
    --opacity: 0.1;
  }

  /* Bigger than hover's, so it stands clear of the fingertip over it, and
     quicker to rise, so it answers the touch rather than following it.
     The 12px between icons still takes it: 1.8 adds 7px a side, its
     neighbor's 1.3 under 3. */
  li[data-touched] span {
    --wave: 1.8;
    --opacity: 1;
    transition-duration: 140ms;
  }

  li[data-touched]+li span,
  li:has(+ li[data-touched]) span {
    --wave: 1.3;
    --opacity: 0.50;
  }

  li[data-touched]+li+li span,
  li:has(+ li + li[data-touched]) span {
    --wave: 1.1;
    --opacity: 0.25;
  }
}
</style>
