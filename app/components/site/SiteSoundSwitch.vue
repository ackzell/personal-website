<script setup lang="ts">
/*
 * The header's other attribute, beside lang="en": sound="on" or "off". Off
 * until switched on (utils/sounds.ts); each press flips it and keeps it.
 * Turning it on is heard (and on the landing page, the mark draws itself in
 * again to be heard too), and so is turning it off, as the last sound until
 * it's back.
 */
const on = ref(false)
// Read after mount: the server can't know, so the value stays hidden till then.
const mounted = useMounted()
// The `on` beep as a file (the panel set's, rendered): the press that turns
// sound on may be what starts the generated audio, which can take a while to
// play out, but a file plays at once.
let onBeep: HTMLAudioElement | undefined
onMounted(() => {
  on.value = soundIsOn()
  onBeep = new Audio('/sound-on.mp3')
})

function toggle() {
  const next = !on.value
  if (next) {
    setSoundOn(true)
    if (onBeep) {
      onBeep.currentTime = 0
      onBeep.play().catch(() => {})
    }
  }
  else sound('off')
  // Muted once `off` has played out (two beeps, the last ending by 0.2s).
  if (!next) setSoundOn(false, 300)
  on.value = next
}
</script>

<template>
  <SiteAttrSwitch name="sound" data-keeps-panel>
    <!-- The button reads as sound, pressed or not. -->
    <button type="button" :aria-pressed="on" :title="$t('site.sound')" @pointerdown="on || wakeSound()" @click="toggle">
      <span class="sr-only">{{ $t('site.sound') }}</span>
      <SiteScrambleText :text="on ? 'on' : 'off'" :style="{ visibility: mounted ? undefined : 'hidden' }"
        aria-hidden="true" />
    </button>
  </SiteAttrSwitch>
</template>
