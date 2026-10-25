import { definePreset } from 'unocss'
import type { Rule } from 'unocss'

/**
 * The site's design system as UnoCSS utilities.
 *
 * CSS custom properties in app/assets/css/main.css stay the source of truth;
 * everything here only points at them, so a token changes in one place.
 */

const sections = ['about', 'work', 'media'] as const
const spaceRoles = ['tight', 'group', 'block', 'section'] as const

// Spacing roles: gap-group, gap-x-tight, mt-section, px-block, …
const spaceProps: Record<string, string[]> = {
  'gap': ['gap'],
  'gap-x': ['column-gap'],
  'gap-y': ['row-gap'],
  'm': ['margin'],
  'mx': ['margin-inline'],
  'my': ['margin-block'],
  'mt': ['margin-top'],
  'mb': ['margin-bottom'],
  'p': ['padding'],
  'px': ['padding-inline'],
  'py': ['padding-block'],
  'pt': ['padding-top'],
  'pb': ['padding-bottom'],
}

const spaceRule: Rule = [
  new RegExp(`^(${Object.keys(spaceProps).join('|')})-(${spaceRoles.join('|')})$`),
  ([, prop, role]) => Object.fromEntries(spaceProps[prop!]!.map((p) => [p, `var(--gap-${role})`])),
  { autocomplete: `(${Object.keys(spaceProps).join('|')})-(${spaceRoles.join('|')})` },
]

// Layout tracks on .page: track-content (default), track-wide, track-full.
const trackRule: Rule = [
  /^track-(content|wide|full)$/,
  ([, track]) => ({ 'grid-column': track }),
  { autocomplete: 'track-(content|wide|full)' },
]

// Header and footer aren't grid children; px-track-wide pads them so their
// content lines up with the wide track anyway.
const trackPaddingRule: Rule = [
  'px-track-wide',
  { 'padding-inline': 'max(var(--gutter), (100% - var(--wide-width)) / 2)' },
]

// Type roles bundle family, weight and Recursive's casual axis together, so a
// role can't be half-applied. Named `typeset`, not `type`: as an attribute,
// `type` already means something on <button> and <input>.
const typeRoles = {
  heading: { family: '--font-heading', weight: '--heading-weight', casual: '--heading-casual' },
  code: { family: '--font-code', weight: '--code-weight', casual: '--code-casual' },
} as const

const typeRule: Rule = [
  /^typeset-(heading|body|code)$/,
  ([, role]) => {
    if (role === 'body') return { 'font-family': 'var(--font-body)', 'font-weight': '400', 'font-variation-settings': 'normal' }
    const r = typeRoles[role as keyof typeof typeRoles]
    return {
      'font-family': `var(${r.family})`,
      'font-weight': `var(${r.weight})`,
      'font-variation-settings': `'CASL' var(${r.casual})`,
    }
  },
  { autocomplete: 'typeset-(heading|body|code)' },
]

export const presetAckzell = definePreset(() => ({
  name: 'preset-ackzell',
  theme: {
    // Semantic colors resolve per section and scheme in main.css, so
    // `text-accent` follows the page without the template knowing which.
    colors: {
      bg: 'var(--bg)',
      fg: 'var(--fg)',
      accent: 'var(--accent)',
      muted: 'var(--muted)',
      line: 'var(--line)',
    },
    // The text scale in em, so it follows body: phones set body a step
    // smaller (main.css) and every text-* follows without its own rule.
    // Line heights unitless, the same ratios as the default rem scale.
    text: {
      'xs': { fontSize: '0.75em', lineHeight: 'calc(1 / 0.75)' },
      'sm': { fontSize: '0.875em', lineHeight: 'calc(1.25 / 0.875)' },
      'base': { fontSize: '1em', lineHeight: '1.5' },
      'lg': { fontSize: '1.125em', lineHeight: 'calc(1.75 / 1.125)' },
      'xl': { fontSize: '1.25em', lineHeight: 'calc(1.75 / 1.25)' },
      '2xl': { fontSize: '1.5em', lineHeight: 'calc(2 / 1.5)' },
    },
  },
  rules: [
    spaceRule,
    trackRule,
    trackPaddingRule,
    typeRule,
    // Project words (lexicon headwords, project headings). Set via class on
    // links: `text` as an attribute breaks <a> (see uno.config.ts).
    ['text-headword', { 'font-size': 'var(--headword-size)', 'line-height': '1' }],
  ],
  shortcuts: {
    // A quiet label over content that speaks for itself, like a dictionary's
    // running head: Projects, Experience, Content.
    'running-head': 'typeset-body text-sm text-muted uppercase tracking-[0.08em]',
    // What an entry is, under its word, the way a dictionary sets a
    // definition: muted, so the word leads. Entries (the lexicon, a project or
    // part heading) at body size; sub-entries (parts, related projects) a
    // step down. Spacing stays with each entry's own layout.
    'gloss': 'text-muted',
    'gloss-sub': 'gloss text-[0.875em]',
  },
  variants: [
    // current:… styles the link for the current page or section. Covers
    // aria-current="page" and "true" alike, but not an explicit "false".
    (matcher) => {
      if (!matcher.startsWith('current:')) return matcher
      return {
        matcher: matcher.slice('current:'.length),
        selector: (s) => `${s}[aria-current]:not([aria-current="false"])`,
      }
    },
    // section-media:… applies only while the page is in that section.
    (matcher) => {
      const match = matcher.match(new RegExp(`^section-(${sections.join('|')}):`))
      if (!match) return matcher
      return {
        matcher: matcher.slice(match[0].length),
        selector: (s) => `:root[data-section="${match[1]}"] ${s}`,
      }
    },
  ],
}))
