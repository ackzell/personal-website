<script setup lang="ts">
/**
 * A project's word line, as a dictionary sets it: the word, then
 * /pronunciation/ and ‘meaning’ on its baseline, no labels. The status rides
 * the word's top-right corner like a superscript, raised over the line so it
 * never pushes the pronunciation along or sits on it.
 * The word itself is the caller's (a heading on the project page, a link in
 * the lexicon), so each keeps its own element and behavior.
 */
withDefaults(defineProps<{
  pronunciation: string
  meaning: string
  status?: ProjectStatus
  /** The line's own element: `dt` in the lexicon, `div` elsewhere. */
  as?: string
}>(), { as: 'div' })

// Pronunciations and meanings come only from the owner; unfilled ones
// (still `TODO` in content) stay out of the UI.
const filled = (value: string) => value && value !== 'TODO'
</script>

<template>
  <component :is="as" flex="~ wrap" items="baseline" gap="x-group y-1">
    <!-- The word and its stamp share one cell. No positioning context here,
         so a link's full-entry overlay still reaches its entry. -->
    <span class="word-line__word">
      <slot />
      <span v-if="status" class="word-line__stamp">
        <span class="word-line__stamp-inner"><ProjectStatus :status="status" /></span>
      </span>
    </span>
    <span v-if="filled(pronunciation)" text="muted">/{{ pronunciation }}/</span>
    <span v-if="filled(meaning)" text="fg">‘{{ meaning }}’</span>
  </component>
</template>

<style scoped>
.word-line__word {
  display: inline-grid;
}
.word-line__word > * {
  grid-area: 1 / 1;
}
/* A zero-size anchor at the word's top-right corner: the stamp hangs off it
   without adding width or height, so the line wraps on the word alone. */
.word-line__stamp {
  justify-self: end;
  align-self: start;
  inline-size: 0;
  block-size: 0;
  overflow: visible;
}
/* Lifted almost clear of the word's top edge, a hair past its last letter. */
.word-line__stamp-inner {
  display: block;
  inline-size: max-content;
  translate: 0.3em -90%;
  line-height: 1;
}
</style>
