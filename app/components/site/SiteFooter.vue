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
         Icons sized in rem, off the em text scale, so phones keep the targets. -->
    <ul flex="~ wrap" p="0" m="-1.5" list="none">
      <li v-for="link in socialLinks" :key="link.href" ref="items">
        <a :href="link.href" rel="me noopener" :aria-label="link.label" :title="link.label" class="text-[1.125rem]" inline-flex
          p="1.5">
          <span :class="link.icon" aria-hidden="true" />
        </a>
      </li>
    </ul>
    <!-- The header's lang="en" sits top right; its twin sits bottom right. -->
    <SiteSchemeSwitch ml="auto" />
  </footer>
</template>

<style scoped>
/*
 * Dock wave: the hovered icon grows most, its neighbors less, the next ones
 * a touch. Scale the icon, not the <li>, which the FLIP above animates.
 * The 12px between icons absorbs the growth, so nothing overlaps or reflows.
 */
.site-footer span {
  --wave: 1;
  --opacity: 1;
  display: block;
  transform: scale(var(--wave));
  transform-origin: bottom center;
  opacity: var(--opacity);
}

/* The rail grows inward, away from the screen edge. */
@media (width < 40rem) {
  .site-footer span {
    transform-origin: right center;
  }
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  /* Dimmed only where hover can bring them back; phones keep full opacity. */
  .site-footer span {
    --opacity: 0.25;
    transition:
      transform 260ms var(--ease-out),
      opacity 260ms var(--ease-out);
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
</style>
