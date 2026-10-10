export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },

  modules: ['@nuxt/content', '@nuxtjs/i18n'],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      ],
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
