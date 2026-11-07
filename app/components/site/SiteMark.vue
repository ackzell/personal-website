<script setup lang="ts">
/*
 * The ax mark as every stage's backdrop, set like the stream background:
 * scaled far past the screen, its ring bleeding off the inline-end edge, in a
 * deeper shade of the section's own fill. It lives in the layout, so it stays
 * put across pages and only its shade follows the section. The header and
 * footer carry clipped copies (SiteMarkLayer), so it reads as one background
 * under all three. Content reads over it untouched.
 *
 * It starts hidden and fades in at rest once mounted, so without JS there is
 * no mark, only the page.
 */
const resting = useState('site-mark-resting', () => false)

onMounted(() => {
  resting.value = true
})

useMarkRipple()
</script>

<template>
  <!-- Out of <main>, so it sits behind the whole stage and rides the root
       snapshot in a section wipe. -->
  <Teleport to="#teleports">
    <SiteMarkLayer />
  </Teleport>
</template>
