import { defineConfig, presetAttributify, presetIcons, presetWind4 } from 'unocss'
import { presetAckzell } from './uno/preset-ackzell'

export default defineConfig({
  content: {
    pipeline: {
      include: [
        // UnoCSS's default: components and markup.
        /\.(vue|svelte|[jt]sx|vine\.ts|mdx?|astro|elm|php|phtml|marko|html)($|\?)/,
        // Plus the nav config, which names its icons as class strings
        // (socialLinks). Plain .ts isn't scanned by default.
        /app\/config\/.+\.ts($|\?)/,
      ],
    },
  },
  presets: [
    // Reset stays off: main.css owns base styles.
    presetWind4({ preflights: { reset: false } }),
    // Interface icons: Iconoir (i-iconoir-*). Brand logos: Simple Icons
    // (i-simple-icons-*). One job each, so UI strokes stay consistent.
    presetIcons({
      extraProperties: { 'display': 'inline-block', 'vertical-align': '-0.125em' },
      // Loaded explicitly: the preset's own Node loader switches itself off
      // when VSCODE_CWD is set, so a dev server started from a VS Code
      // terminal rendered every icon blank.
      collections: {
        'iconoir': () => import('@iconify-json/iconoir/icons.json', { with: { type: 'json' } }).then((m) => m.default),
        'simple-icons': () => import('@iconify-json/simple-icons/icons.json', { with: { type: 'json' } }).then((m) => m.default),
      },
    }),
    // Utilities as attributes: <ul flex gap="y-tight x-group">.
    // Never `text="…"` on a link (<a>, NuxtLink): HTMLAnchorElement.text is
    // textContent, so a client-side mount replaces the label. Use class.
    presetAttributify(),
    presetAckzell(),
  ],
})
