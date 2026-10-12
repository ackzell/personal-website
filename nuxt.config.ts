export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },

  modules: ['@nuxt/content', '@nuxtjs/i18n', '@nuxt/fonts', '@unocss/nuxt'],

  css: ['~/assets/css/main.css'],

  experimental: {
    // Route changes run as view transitions (skipped under reduced motion).
    // Styles in main.css, direction tagging in plugins/section-transition.client.ts.
    viewTransition: true,
  },

  app: {
    head: {
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      ],
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
        // Covers code (320) through headings (520) and a bold step.
        weights: ['300 700'],
      },
      { name: 'Commit Mono', provider: 'fontsource', weights: [400, 700] },
    ],
    google: {
      experimental: {
        // Pin MONO so Google serves a smaller instance; keep CASL variable.
        // slnt + CRSV drive the lexicon headword hover (lean into cursive
        // forms); they roughly double the file (latin ~105 → ~221 KB).
        // (0.14 reads axes here; the per-family `variableAxis` is unreleased.)
        variableAxis: {
          Recursive: { MONO: ['1'], CASL: [['0', '1']], CRSV: [['0', '1']], slnt: [['-15', '0']] },
        },
      },
    },
  },

  content: {
    // Node >= 22.5 ships node:sqlite, so no native addon to build.
    experimental: { sqliteConnector: 'native' },
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

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/'],
    },
  },
})
