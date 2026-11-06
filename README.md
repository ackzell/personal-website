# ackzell.dev

Personal site and portfolio. Nuxt 4 + Nuxt Content + @nuxtjs/i18n, prerendered and deployed to Cloudflare Pages.

```sh
vp install
vp run dev        # nuxt dev
vp run generate   # static build → .output/public
vp run test       # feed parser tests
```

Contributions, episodes, playlists and Amoxtli's chapters are read at build time. `.github/workflows/rebuild.yml` calls a Cloudflare Pages deploy hook daily (repo secret `SITE_DEPLOY_HOOK`) to keep them current. A source that fails also fails the build, so the last good deploy stays up.

## Structure

```
app/
  config/nav.ts         main nav + social links (single source of truth)
  composables/          the only way pages get data
  components/site/      header, flag nav, locale/scheme/sound switches, footer
  components/word/      WordHeading: Nahuatl word, pronunciation, meaning
  components/project/   project index, ledger, lexicon, parts, status
  components/<area>/    home, contribution, guide, media, uses
  pages/                /, /contributions, /uses, /projects, /projects/[slug],
                        /projects/[slug]/[part], /content, /content/videos, /content/podcast
  utils/                sounds, haptics, transitions, months
content/
  projects/<slug>.yml          language-agnostic project metadata
  projects/<slug>/<part>.yml   a project's parts (tlapalli's themes, site)
  <locale>/projects/<slug>.md  translated copy + case study (parts alike)
  experience/, recognition/    roles, awards and certifications
  contributions.yml, media.yml, uses.yml   curation for the fetched lists
server/api/             GitHub merges, podcast RSS, YouTube playlists; run at build
tests/                  `vp run test` (node --test)
i18n/locales/           UI strings (en, es)
content.config.ts       collection schemas (zod), validated at build
```

A project's file name is its slug and the Nahuatl word it's named after. Every project
needs a `.yml` plus a `.md` per locale; a missing translation fails the build.

Routes: English at `/`, Spanish at `/es/…`, same paths in both.
