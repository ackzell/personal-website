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
    // (i-simple-icons-*), or i-brand-* for one Simple Icons doesn't have.
    // One job each, so UI strokes stay consistent.
    presetIcons({
      extraProperties: { 'display': 'inline-block', 'vertical-align': '-0.125em' },
      // Loaded explicitly: the preset's own Node loader switches itself off
      // when VSCODE_CWD is set, so a dev server started from a VS Code
      // terminal rendered every icon blank.
      collections: {
        'iconoir': () => import('@iconify-json/iconoir/icons.json', { with: { type: 'json' } }).then((m) => m.default),
        'simple-icons': () => import('@iconify-json/simple-icons/icons.json', { with: { type: 'json' } }).then((m) => m.default),
        'brand': {
          // From tlapalli-zed-video, viewBox cropped to the mark so it sizes like the others.
          'motion-canvas': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="7.5 7 34.6 34.6">
          <rect fill="currentColor" x="23.41" y="19.41" width="4" height="12" rx="2" ry="2" transform="translate(-10.53 25.41) rotate(-45)" />
          <rect fill="currentColor" x="24.12" y="11.22" width="4" height="10" rx="2" ry="2" transform="translate(-3.82 23.22) rotate(-45)" />
          <rect fill="currentColor" x="17.05" y="7.15" width="4" height="4" rx="2" ry="2" transform="translate(-.89 16.15) rotate(-45)" />
          <rect fill="currentColor" x="12.45" y="7.95" width="4" height="13" rx="2" ry="2" transform="translate(-5.99 14.45) rotate(-45)" />
          <rect fill="currentColor" x="12.1" y="16" width="4" height="16" rx="2" ry="2" transform="translate(-12.84 17) rotate(-45)" />
          <rect fill="currentColor" x="22.31" y="26.38" width="4" height="12" rx="2" ry="2" transform="translate(6.5 68.74) rotate(-117)" />
          <rect fill="currentColor" x="28.6" y="29.58" width="4" height="12" rx="2" ry="2" transform="translate(66.38 65.94) rotate(171)" />
          <rect fill="currentColor" x="33.58" y="24.6" width="4" height="12" rx="2" ry="2" transform="translate(71.37 .24) rotate(99)" />
          <rect fill="currentColor" x="30.38" y="18.31" width="4" height="12" rx="2" ry="2" transform="translate(14.57 -12.05) rotate(27)" />
        </svg>`,
        },
      },
    }),
    // Utilities as attributes: <ul flex gap="y-tight x-group">.
    // Never `text="…"` on a link (<a>, NuxtLink): HTMLAnchorElement.text is
    // textContent, so a client-side mount replaces the label. Use class.
    presetAttributify(),
    presetAckzell(),
  ],
})
