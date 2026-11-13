<script setup lang="ts">
defineProps<{ status: ProjectStatus }>()
</script>

<template>
  <!-- A stamp: the label set in a field of ink, its shade the state. -->
  <span class="project-status" :data-status="status">{{ $t(`projects.status.${status}`) }}</span>
</template>

<style scoped>
.project-status {
  display: inline-block;
  padding: 0.1em 0.45em;
  font-size: 0.7rem;
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: var(--fg);
  color: var(--bg);
}

/* The solid stamp is already the page inside out, so its selection turns it
   back. */
.project-status[data-status='shipped']::selection {
  background-color: var(--bg);
  color: var(--fg);
}

/* Three steps of one ink, so the state reads by weight alone: shipped is the
   solid stamp, active a half-set field, experiment barely inked. The lighter
   two carry the foreground as their label. No outlines: no borders here. */
.project-status[data-status='active'] {
  background: color-mix(in oklab, var(--fg) 38%, var(--bg));
  color: var(--fg);
}

.project-status[data-status='experiment'] {
  background: color-mix(in oklab, var(--fg) 14%, var(--bg));
  color: var(--fg);
}
</style>
