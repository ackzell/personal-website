<script setup lang="ts">
/**
 * A run of figures in the guide's text (a row's totals, a video's date, length
 * and views): each is a number and, when it has one, the unit that goes with
 * it. The number is full strength in the code voice; the unit steps back, so
 * the eye lands on the data and skips the labels. No colors, no separators:
 * the gap does the separating. A soft figure (a date) steps back whole: it
 * frames the others rather than being the number to read.
 */
defineProps<{ figures: { value: string, unit?: string, soft?: boolean }[] }>()
</script>

<template>
  <span class="figures">
    <span v-for="figure in figures" :key="figure.value + figure.unit" class="figure"
      :class="{ 'figure--soft': figure.soft }">
      <span class="figure__value">{{ figure.value }}</span><span v-if="figure.unit" class="figure__unit"> {{ figure.unit
        }}</span>
    </span>
  </span>
</template>

<style scoped>
.figures {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0 1.5ch;
}

.figure {
  white-space: nowrap;
}

/* Recursive's measured end (the code voice), set in tabular figures. */
.figure__value {
  color: var(--fg);
  font-family: var(--font-code);
  font-variation-settings: 'CASL' 0;
  font-variant-numeric: tabular-nums;
}

.figure--soft .figure__value {
  color: var(--muted);
  font-variation-settings: 'CASL' 0, 'wght' 300;
}

.figure__unit {
  color: var(--muted);
}
</style>
