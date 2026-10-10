# ackzell.dev

Personal site and portfolio. Nuxt 4 + Nuxt Content + @nuxtjs/i18n, prerendered and deployed to Cloudflare Pages.

```sh
vp install
vp run dev        # nuxt dev
vp run generate   # static build → .output/public
```

## Structure

```
app/
  config/nav.ts         main nav + social links (single source of truth)
  composables/          the only way pages get data
  components/site/      header, nav, locale switch, footer
  components/word/      WordHeading: Nahuatl word, pronunciation, meaning
  components/project/   ProjectCard, ProjectStatus
  pages/                /, /projects, /projects/[slug], /videos, /podcast, /about
content/
  projects/<slug>.yml        language-agnostic project metadata
  <locale>/projects/<slug>.md  translated copy + case study
i18n/locales/           UI strings (en, es)
content.config.ts       collection schemas (zod), validated at build
```

A project's file name is its slug and the Nahuatl word it's named after. Every project
needs a `.yml` plus a `.md` per locale; a missing translation fails the build.

Routes: English at `/`, Spanish at `/es/…`, same paths in both.
