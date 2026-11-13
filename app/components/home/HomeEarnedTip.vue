<script setup lang="ts">
/**
 * An award or certification, whole: what it is, who gave it, when, and what
 * it was for. Shown in a tooltip wherever the entry appears in short.
 */
defineProps<{ item: Recognition }>()

const formatMonth = useMonthFormat()
</script>

<template>
  <span class="earned-tip" grid typeset="body" text="sm">
    <strong font="semibold">{{ item.title }}</strong>
    <span>
      {{ item.issuer }}
      <span class="tabular-nums" typeset="code" text="xs" whitespace="nowrap">&ensp;
        <time :datetime="item.start">{{ formatMonth(item.start) }}</time>
        <template v-if="item.end">&ensp;–&ensp;<time :datetime="item.end">{{ formatMonth(item.end) }}</time></template>
      </span>
    </span>
    <span v-if="item.detail">{{ item.detail }}</span>
  </span>
</template>

<style scoped>
.earned-tip {
  gap: var(--space-1);
}
</style>
