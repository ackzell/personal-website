<script setup lang="ts">
import { animate, scrambleText } from 'animejs'

/*
 * The footer's twin of the header's lang="en": the switch as the CSS it sets,
 * color-scheme="system", "light" or "dark". It starts on the system's scheme;
 * each press moves to the next one and keeps it.
 */
type Scheme = 'system' | 'light' | 'dark'

const order: Scheme[] = ['system', 'light', 'dark']

const colorMode = useColorMode()
const reduceMotion = usePreferredReducedMotion()
const { t } = useI18n()

// The phone rail stands on it (main.css), so it needs the height.
usePublishedHeight(useTemplateRef<HTMLElement>('root'), '--scheme-height')

// The stored preference, not the resolved scheme, so "system" can show. Until
// it is known (prerendered pages, until mount) the text stays hidden. Gated on
// mount too: the server renders it hidden, and if the client already knows the
// scheme at hydration, Vue never patches that mismatched style away.
const mounted = useMounted()
const known = computed(() => mounted.value && !colorMode.unknown)
const scheme = computed<Scheme>(() => {
  const preference = colorMode.preference as Scheme
  return order.includes(preference) ? preference : 'system'
})
const next = computed<Scheme>(() => order[(order.indexOf(scheme.value) + 1) % order.length]!)

const labels = computed<Record<Scheme, string>>(() => ({
  system: t('site.schemeSystem'),
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

function toggle() {
  const from = shown.value
  const to = next.value
  colorMode.preference = to
  if (reduceMotion.value === 'reduce') return

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
  <!-- The quotes and property name are decoration; the button reads as what
       it does and where it stands. -->
  <div ref="root" class="scheme-switch">
    <!-- Only shown where it leaves the footer bar (phones), so the mark
         carries across its own background too. -->
    <SiteMarkLayer clipped class="scheme-switch__mark" />
    <span class="scheme-switch__name" aria-hidden="true">color-scheme="</span>
    <button type="button" class="scheme-switch__value" :title="labels[next]" data-no-scramble @click="toggle">
      <span class="sr-only">{{ $t('site.scheme') }}: {{ labels[scheme] }}</span>
      <span class="scheme-switch__text" :style="{ visibility: known ? undefined : 'hidden' }" aria-hidden="true">{{
        shown }}</span>
    </button>
    <span class="scheme-switch__name" aria-hidden="true">"</span>
  </div>
</template>

<style scoped>
.scheme-switch {
  display: flex;
  align-items: baseline;
  font-family: var(--font-code);
  font-weight: var(--code-weight);
  font-variation-settings: 'CASL' 0;
  font-size: 0.75rem;
  color: var(--muted);
}

.scheme-switch__value {
  padding: var(--space-1) 0.15em;
  border: 0;
  background: none;
  font: inherit;
  font-variation-settings: inherit;
  color: var(--fg);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 0.3em;
  transition: text-decoration-color 150ms ease;
}

/* Same as the locale switch: hover or focus underlines the value. */
.scheme-switch__value:is(:hover, :focus-visible) {
  text-decoration-color: currentColor;
}

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
