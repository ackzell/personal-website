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
const fields: Record<Section, { bg: string; accent: string; mark: string }> = {
  about: { bg: '#0b1612', accent: '#4a9273', mark: '#091410' },
  work: { bg: '#0c0b0a', accent: '#e4dcca', mark: '#100f0e' },
  media: { bg: '#1e0d0e', accent: '#b84c4c', mark: '#1b0c0c' },
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
    <!-- The menu's band: hairline fields, the page's own marked. -->
    <div :style="{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px', height: '6px' }">
      <div v-for="name in order" :key="name"
        :style="{ flex: 1, height: name === section ? '6px' : '2px', backgroundColor: fields[name].accent }" />
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
