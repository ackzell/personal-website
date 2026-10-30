<script setup lang="ts">
// One horizontal rule of a box-drawn table: left end, the runs over each
// column with their joints, right end.
defineProps<{ glyphs: readonly [string, string, string, string] }>()
</script>

<template>
  <div class="box__rule" aria-hidden="true">
    <span>{{ glyphs[0] }}</span>
    <span class="box__rule-run" />
    <span>{{ glyphs[1] }}</span>
    <span class="box__rule-run" />
    <span class="box__rule-j2">{{ glyphs[2] }}</span>
    <span class="box__rule-run box__rule-run--note" />
    <span>{{ glyphs[3] }}</span>
  </div>
</template>

<style scoped>
/* Long enough for any column; the run clips it to its own width. */
.box__rule-run {
  position: relative;
  overflow: clip;
  white-space: pre;
}

/* Out of flow, so the long run never widens its column. A space keeps the
   line its height. */
.box__rule-run::after {
  content: ' ';
}

.box__rule-run::before {
  position: absolute;
  inset-inline-start: 0;
  content: '────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────';
}
</style>
