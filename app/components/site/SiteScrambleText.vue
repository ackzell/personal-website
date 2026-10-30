<script setup lang="ts">
import { animate, scrambleText } from 'animejs'

/*
 * Text that decodes from its old value into its new one when it changes, as
 * the scheme switch does on a press and the page does on a language switch.
 * Screen readers get the text itself, never the noise.
 *
 * `still` only swaps, for a copy that arrives with its page and already moves
 * with it. Under reduced motion it always only swaps.
 */
const props = defineProps<{ text: string, still?: boolean }>()

const reduceMotion = usePreferredReducedMotion()

const shown = ref(props.text)
let running: ReturnType<typeof animate> | undefined

watch(() => props.text, (to, from) => {
  running?.cancel()
  running = undefined
  if (props.still || reduceMotion.value === 'reduce') {
    shown.value = to
    return
  }

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
})

onBeforeUnmount(() => running?.cancel())
</script>

<template>
  <!-- The language switch's own scramble keeps off it: this one already
       decodes the change, and the two would fight over the same text. -->
  <span :data-no-scramble="still ? undefined : ''">
    <span class="sr-only">{{ text }}</span>
    <span aria-hidden="true">{{ shown }}</span>
  </span>
</template>
