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
onMounted(() => (on.value = soundIsOn()))

function toggle() {
  const next = !on.value
  // On: once the output is playing (the first press starts it), and a beat
  // after unmuting, so the gain's glide up doesn't eat the beep.
  if (next) {
    setSoundOn(true)
    soundAwake().then(() => setTimeout(() => sound('on'), 80))
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
