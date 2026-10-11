import { defineConfig, presetAttributify, presetIcons, presetWind4 } from 'unocss'
import { presetAckzell } from './uno/preset-ackzell'

export default defineConfig({
  presets: [
    // Reset stays off: main.css owns base styles.
    presetWind4({ preflights: { reset: false } }),
    // Interface icons: Iconoir (i-iconoir-*). Brand logos: Simple Icons
    // (i-simple-icons-*). One job each, so UI strokes stay consistent.
    presetIcons({
      extraProperties: { 'display': 'inline-block', 'vertical-align': '-0.125em' },
    }),
    // Utilities as attributes: <ul flex gap="y-tight x-group">.
    presetAttributify(),
    presetAckzell(),
  ],
})
