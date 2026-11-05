import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import tlapalliJson from './shiki/tlapalli.json'

// JSON widens `type` to string; Shiki wants to know it's a dark or light theme.
const tlapalli = tlapalliJson.map((theme) => ({ ...theme, type: theme.type as 'dark' | 'light' }))

// Prerendered so a feed that fails fails the build and the last good deploy
// stays up. The pages alone would swallow the error and publish a blank section.
const playlists = [...readFileSync('content/media.yml', 'utf8').matchAll(/playlist: (\S+)/g)]
  .map(([, id]) => `/api/playlists/${id}`)

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },

  modules: ['@nuxt/content', '@nuxtjs/i18n', '@nuxt/fonts', '@unocss/nuxt', '@vueuse/nuxt/module', '@nuxtjs/color-mode', 'nuxt-og-image', '@nuxtjs/sitemap'],

  css: ['~/assets/css/main.css', '~/assets/css/media.css', '~/assets/css/tlapalli.css'],

  hooks: {
    // Schemas for the YAML in content/, so VS Code checks it while editing
    // (scripts/content-schemas.mjs).
    async 'modules:done'() {
      const [{ writeContentSchemas }, { default: config }] = await Promise.all([
        import('./scripts/content-schemas.mjs'),
        import('./content.config'),
      ])
      writeContentSchemas(config)
      // Dev only: warns when a page exists in one locale but not the other.
      if (process.env.NODE_ENV !== 'production') (await import('./scripts/content-pairs.mjs')).watchContentPairs()
    },
    // Dev only: every sound in every set, side by side (app/dev/sounds.vue).
    'pages:extend'(pages) {
      if (process.env.NODE_ENV === 'production') return
      pages.push({ name: 'dev-sounds', path: '/dev/sounds', file: fileURLToPath(new URL('./app/dev/sounds.vue', import.meta.url)) })
    },
  },

  experimental: {
    // Route changes run as view transitions (skipped under reduced motion).
    // Styles in main.css, direction tagging in plugins/section-transition.client.ts.
    viewTransition: true,
    // Its wait for a frame before each navigation lands inside the view
    // transition, where rendering is held, so no frame comes and every page
    // change sat out its 100ms fallback on a frozen screen.
    navigationRepaint: false,
  },

  app: {
    head: {
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      ],
      // A screen that would switch on from JS (usePowerOn) is simply lit.
      noscript: [{ innerHTML: '<style>.power-screen{clip-path:none!important;animation:none!important}</style>' }],
    },
  },

  // Self-hosted at build time. Type system notes live in main.css.
  fonts: {
    defaults: {
      subsets: ['latin-ext', 'latin'],
      styles: ['normal'],
    },
    families: [
      {
        name: 'Recursive',
        provider: 'google',
        // Also for the social cards, which only see global fonts.
        global: true,
        // Covers code (320) through headings (520) and a bold step.
        weights: ['300 700'],
        // Pin MONO so Google serves a smaller instance; keep CASL variable.
        // slnt + CRSV drive the lexicon headword hover (lean into cursive
        // forms); they roughly double the file (latin ~105 → ~221 KB).
        variableAxis: { MONO: ['1'], CASL: [['0', '1']], CRSV: [['0', '1']], slnt: [['-15', '0']] },
      },
      { name: 'Source Code Pro', provider: 'google', weights: [400, 700], global: true },
    ],
  },

  // Sets .light or .dark on <html> before first paint; main.css themes from
  // those. Follows the system until the footer switch picks a scheme.
  colorMode: {
    storageKey: 'color-scheme',
  },

  runtimeConfig: {
    // Optional; lifts GitHub's search rate limit (server/api/contributions.get.ts).
    githubToken: '',
    // Optional; adds download counts to the podcast (server/api/episodes.get.ts).
    // Server-only: read at build time, never sent to the browser.
    buzzsproutApiKey: process.env.BUZZSPROUT_API_KEY ?? '',
    // Optional; adds every video, with lengths and views, to the playlists
    // (server/utils/youtube.ts). Server-only, like the one above.
    youtubeApiKey: process.env.YT_API_KEY ?? '',
  },

  content: {
    // Node >= 22.5 ships node:sqlite, so no native addon to build.
    experimental: { sqliteConnector: 'native' },
    // Code is colored with the tlapalli themes, every gem at once: each token
    // carries a --shiki-<gem> variable per theme, and CSS picks one
    // (main.css, MediaTake). No highlighting happens in the browser.
    build: {
      markdown: {
        highlight: {
          // A string names one of Shiki's bundled themes; these are passed as
          // the theme objects themselves.
          theme: {
            default: tlapalli.find((theme) => theme.name === 'tlapalli-jade')!,
            ...Object.fromEntries(tlapalli.map((theme) => [theme.name.replace('tlapalli-', ''), theme])),
          },
          langs: ['ts', 'tsx', 'vue', 'js', 'json', 'css', 'html', 'bash', 'yaml'],
        },
      },
    },
  },

  i18n: {
    baseUrl: 'https://ackzell.dev',
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    // A static site can't redirect on the server; client-side redirects
    // on first visit are more annoying than helpful.
    detectBrowserLanguage: false,
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'es', language: 'es-419', name: 'Español', file: 'es.json' },
    ],
  },

  // Every page is prerendered, so cards are built once and no renderer ships.
  ogImage: { zeroRuntime: true },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/api/contributions', '/api/episodes', '/api/amoxtli-chapters', ...playlists],
    },
  },
})
