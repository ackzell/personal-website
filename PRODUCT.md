# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** developers. The site is built for them: they explore the work, the projects, and how they were built.
- **Secondary:** recruiters. They must be able to scan the site quickly and understand who the owner is and what they have built, without going through the experience layer.
- **Out of scope:** prospective clients.

## Product Purpose

Personal site and portfolio for ackzell.dev. It shows the work (projects and contributions), the media (videos, podcast), and the person (about). Success: the site reads as "engineer, not tinkerer" — casual, but not cartoony.

## Positioning

Open decision. Positioning will be defined by the owner's own copy; future work must not assume or invent a positioning claim.

## Operating Context

- Three sections: **about** (landing / home), **work**, **media**.
- Bilingual: English at `/`, Spanish at `/es/…`, same paths in both locales.
- Projects are named after Nahuatl words. Project pages open with the word, its pronunciation, and its meaning; other pages do not.
- The experience is a layer over plain, accessible, crawlable routes and content, not a replacement for them.

## Capabilities and Constraints

- Nuxt 4 + Nuxt Content + @nuxtjs/i18n, prerendered (static) and deployed to Cloudflare Pages.
- Content schemas are validated at build time; every project needs a `.yml` and a `.md` per locale, and a missing translation fails the build.
- External data only flows through `server/sources/*` → `shared/types` → composables.
- The tlapalli theme switcher applies only to code snippets.
- Nothing ships to `main`/production until launch.
- Launch bar: complete EN + ES content, the motion core, and a solid reduced-motion / accessibility path.
- Opt-in layers planned post-launch: sound (composed by the owner, off by default), haptics, and an "x-ray" mode that lets the visitor see the machinery.

## Brand Commitments

- **All copy is written by the owner in both English and Spanish.** No AI-generated copy, translations, or inspiration.
- **Never invent Nahuatl.** Pronunciations and meanings come only from the owner; leave TODOs where they are missing.
- Nahuatl lives in naming only, not as a visual metaphor.
- Framing: enterprise rigor applied to delight. Simple does not mean easy to build or featureless.

## Evidence on Hand

- Showcase projects (`content/projects/*.yml`, `content/{en,es}/projects/*.md`): amoxtli (flagship), tlapalli (VS Code + Zed themes + website), tlachialoni, yehyecoa, moliniani (experiment).
- Merged open-source PRs, presented as a contributions strip.
- Heartbeat gets a single "where it started" line.
- Devlog is a YouTube livestream playlist (RSS).
- amoxtli's preview is invite-only: never link it; use media plus a "request access" path.
- Excluded from the showcase: xitomatl, tlapanolli, vue-workshop.
- Absent: testimonials, client logos, and metrics. Do not fabricate them.

## Product Principles

1. Content first: every experience layer degrades to readable, crawlable content.
2. Developers explore; recruiters scan. Both paths must work.
3. Craft shows in the details: rigor applied to delight, never decoration for its own sake.
4. The owner's voice is the only voice: human-written, bilingual, no invented facts.

## Accessibility & Inclusion

- Reduced motion is a launch requirement: every motion experiment ships with its reduced-motion answer.
- Opt-in sensory layers (sound, haptics) stay off by default.
- Formal conformance target (e.g. WCAG level): undecided.
