<script setup lang="ts">
/*
 * A link off the site (YouTube, the live site), marked with an arrow out.
 * Pass `href`; the label is the slot. Where it closes a caption line, the
 * caller spaces it (ms="group first:0").
 */
</script>

<template>
  <a class="media__out whitespace-nowrap underline-offset-[0.25em]">
    <slot /><span class="i-iconoir-arrow-up-right" ms="[0.2em]" text="[0.85em]" aria-hidden="true" />
  </a>
</template>
