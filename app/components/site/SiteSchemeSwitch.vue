<script setup lang="ts">
import { animate, scrambleText } from 'animejs'
import type { ComponentPublicInstance } from 'vue'

/*
 * The footer's twin of the header's lang="en": the switch as the CSS it sets,
 * color-scheme="vivid", "light" or "dark". Until a press it shows the light or
 * dark the system resolved to; each press moves to the next one and keeps it.
 * Vivid, the whole page in its section's flag color, is only ever picked.
 */
type Scheme = 'vivid' | 'light' | 'dark'

const order: Scheme[] = ['vivid', 'light', 'dark']

const colorMode = useColorMode()
const reduceMotion = usePreferredReducedMotion()
const { t } = useI18n()

// The phone rail stands on it (main.css), so it needs the height.
const root = useTemplateRef<ComponentPublicInstance>('root')
const el = computed(() => (root.value?.$el ?? null) as HTMLElement | null)
usePublishedHeight(el, '--scheme-height')

// The stored preference, not the resolved scheme, so "system" can show. Until
// it is known (prerendered pages, until mount) the text stays hidden. Gated on
// mount too: the server renders it hidden, and if the client already knows the
// scheme at hydration, Vue never patches that mismatched style away.
const mounted = useMounted()
const known = computed(() => mounted.value && !colorMode.unknown)
const scheme = computed<Scheme>(() => {
  // Everything it feeds (text, title, label) must match the server's at hydration.
  if (!known.value) return 'light'
  const preference = colorMode.preference as Scheme
  if (order.includes(preference)) return preference
  // No pick yet ("system"): the scheme the system resolved to.
  return colorMode.value === 'dark' ? 'dark' : 'light'
})
const next = computed<Scheme>(() => order[(order.indexOf(scheme.value) + 1) % order.length]!)

// Where each lands on the flip clock's tock: brighter on light, duller on dark.
const LIGHT: Record<Scheme, number> = { light: 1, vivid: 0.5, dark: 0 }

const labels = computed<Record<Scheme, string>>(() => ({
  vivid: t('site.schemeVivid'),
  light: t('site.schemeLight'),
  dark: t('site.schemeDark'),
}))

/*
 * Shown text, driven by hand so a press can decode the old value into the new
 * one like the locale switch does. Once the scheme is known after mount it
 * settles quietly, without the scramble.
 */
const shown = ref<string>(scheme.value)
let running: ReturnType<typeof animate> | undefined

watch(scheme, (value) => {
  if (!running) shown.value = value
})

/*
 * The new scheme is scanned onto the page: a line of light rises from the
 * switch, at the bottom on every screen, and leaves the new scheme behind it,
 * the way a clip in the media palette is scanned in (main.css, "Scheme scan").
 * The class flips inside a view transition, so the old page is a still
 * snapshot above the line and the new one is live below it.
 */
let scan: ViewTransition | undefined

function scanTo(to: Scheme) {
  const html = document.documentElement
  scan?.skipTransition()
  // Before the old snapshot: only the stage is captured, and nothing fades.
  html.dataset.schemeScan = ''
  const line = document.createElement('div')
  line.className = 'scheme-scan'
  line.setAttribute('aria-hidden', 'true')
  // The old scheme's ink, for the haze it throws ahead onto the old page.
  line.style.setProperty('--scan-old', getComputedStyle(html).getPropertyValue('--fg'))
  const own = document.startViewTransition(async () => {
    colorMode.preference = to
    // Two chained watchers in the color-mode plugin put the class on <html>.
    await nextTick()
    if (!html.classList.contains(to)) await new Promise(requestAnimationFrame)
    // Only in the new state, so it has nothing to cross-fade from.
    document.body.append(line)
  })
  scan = own
  own.finished.finally(() => {
    line.remove()
    if (scan !== own) return
    scan = undefined
    delete html.dataset.schemeScan
  })
}

function toggle() {
  const from = shown.value
  const to = next.value
  // Nothing scrambles or sweeps: a short fade, felt and heard as any other setting.
  if (reduceMotion.value === 'reduce') {
    colorMode.preference = to
    haptic('scheme')
    return sound('toggle')
  }

  if ('startViewTransition' in document) {
    scanTo(to)
    // Felt and heard as the line it is, crossing the page.
    haptic('sweep')
    soundSweep()
  }
  else {
    colorMode.preference = to
    haptic('scheme')
    // Heard as a flip clock turning over, on the scramble's own timing,
    // leaning a little toward where the switch sits: one word alone off to
    // one side would sound one-eared in headphones.
    const rect = el.value?.getBoundingClientRect()
    soundClock({
      at: 0,
      chars: Math.max(from.length, to.length),
      step: 1 / 40,
      settle: 0.3,
      pan: rect ? ((rect.left + rect.right) / window.innerWidth - 1) * 0.35 : 0,
    }, LIGHT[to])
  }

  running?.cancel()
  const proxy = document.createElement('span')
  proxy.textContent = from
  running = animate(proxy, {
    innerHTML: scrambleText({ text: to, chars: 'lowercase', from: 'left', revealRate: 40, settleDuration: 300 }),
    onUpdate: () => {
      shown.value = proxy.textContent ?? to
    },
    onComplete: () => {
      running = undefined
      shown.value = to
    },
  })
}
</script>

<template>
  <!-- The button reads as what it does and where it stands. -->
  <SiteAttrSwitch ref="root" name="color-scheme" class="scheme-switch" data-keeps-panel>
    <!-- Only shown where it leaves the footer bar (phones), so the mark
         carries across its own background too. -->
    <SiteMarkLayer clipped class="scheme-switch__mark" />
    <button type="button" :title="labels[next]" data-no-scramble @click="toggle">
      <span class="sr-only">{{ $t('site.scheme') }}: {{ labels[scheme] }}</span>
      <span :style="{ visibility: known ? undefined : 'hidden' }" aria-hidden="true">{{ shown }}</span>
    </button>
  </SiteAttrSwitch>
</template>

<style scoped>
.scheme-switch__mark {
  display: none;
}

/*
 * On phones the footer is a rail of icons, too narrow for the attribute. The
 * switch leaves it for the bottom-right corner, on its own copy of the stage,
 * and the rail stands on top of it (--scheme-height, main.css).
 */
@media (width < 40rem) {
  .scheme-switch {
    position: fixed;
    inset-inline-end: 0;
    bottom: 0;
    isolation: isolate;
    padding: var(--space-1) var(--space-2);
    background: var(--bg);
    transition: background-color 600ms var(--ease-out);
  }

  .scheme-switch__mark {
    display: block;
  }
}
</style>
