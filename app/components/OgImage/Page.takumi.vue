<script setup lang="ts">
const props = defineProps<{
  title: string
  section: Section
  pronunciation?: string
  meaning?: string
  parent?: string
}>()

// Takumi can't read main.css, so the dark colors are repeated here. The mark
// is a touch fainter than the stage's, to stay almost invisible.
const fg = '#e4dcca'
// hot is main.css's --hot in dark: the accent mixed 45% toward white in oklab.
// line is --line: fg mixed 20% into the stage, for the fields not lit.
const fields: Record<Section, { bg: string; accent: string; hot: string; line: string; mark: string }> = {
  about: { bg: '#0b1612', accent: '#4a9273', hot: '#9dc2b0', line: '#363e37', mark: '#091410' },
  work: { bg: '#0c0b0a', accent: '#e4dcca', hot: '#f0ece2', line: '#373530', mark: '#100f0e' },
  media: { bg: '#1e0d0e', accent: '#b84c4c', hot: '#dd9d99', line: '#463634', mark: '#1b0c0c' },
}
const order: Section[] = ['about', 'work', 'media']
const stage = computed(() => fields[props.section])
// Unfilled pronunciations and meanings stay `TODO` in content.
const filled = (value?: string) => value && value !== 'TODO'
</script>

<template>
  <div
    :style="{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'relative', padding: '56px 80px', backgroundColor: stage.bg, color: fg, fontFamily: 'Recursive', fontVariationSettings: `'CASL' 0.65` }">
    <!-- The stage's backdrop, cropped as SiteMarkLayer crops it. -->
    <SiteMarkGlyph
      :style="{ position: 'absolute', left: '683px', top: '-195px', width: '970px', height: '970px', color: stage.mark }" />
    <!-- The menu's band: the page's own field lit and glowing (--glow-near), the others the stage's line. -->
    <div :style="{ position: 'relative', display: 'flex', gap: '6px', height: '6px' }">
      <div v-for="name in order" :key="name"
        :style="name === section
          ? { flex: 1, backgroundColor: fields[name].hot, boxShadow: `0 0 2px ${fields[name].accent}e6, 0 0 8px ${fields[name].accent}b3, 0 0 20px ${fields[name].accent}73` }
          : { flex: 1, backgroundColor: stage.line }" />
    </div>
    <div :style="{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }">
      <div v-if="parent" :style="{ fontSize: '44px', opacity: 0.7, marginBottom: '20px' }">{{ parent }}</div>
      <div :style="{ fontSize: title.length > 18 ? '84px' : '120px', fontWeight: 520, lineHeight: 1.05 }">{{ title }}</div>
      <div v-if="filled(pronunciation)" :style="{ fontSize: '40px', opacity: 0.7, marginTop: '36px' }">/{{ pronunciation }}/</div>
      <div v-if="filled(meaning)" :style="{ fontSize: '40px', marginTop: '12px' }">‘{{ meaning }}’</div>
    </div>
    <div :style="{ position: 'relative', fontSize: '32px', fontFamily: 'Source Code Pro' }">ackzell.dev</div>
  </div>
</template>
