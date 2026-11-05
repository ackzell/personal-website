/**
 * Dev only: every page under content/en/ needs its twin under content/es/
 * (and back), and every project or part in content/projects/ needs both.
 * A missing one empties that list on the site in that language, with no error
 * on screen (useProjects throws inside useAsyncData), so this says it in the
 * terminal when the dev server starts and whenever content/ changes.
 */
import { globSync, watch } from 'node:fs'

const locales = ['en', 'es']

/** `es/projects/tlapalli/screenshots.md`-style paths each locale is missing. */
export function missingPages(root = 'content') {
  const pages = new Set(globSync('projects/**/*.yml', { cwd: root }).map((path) => path.replace(/\.yml$/, '.md')))
  const have = {}
  for (const locale of locales) {
    have[locale] = new Set(globSync('**/*.md', { cwd: `${root}/${locale}` }))
    have[locale].forEach((page) => pages.add(page))
  }
  return locales.flatMap((locale) => [...pages].filter((page) => !have[locale].has(page)).map((page) => `${locale}/${page}`)).sort()
}

export function watchContentPairs(root = 'content') {
  const check = () => {
    const missing = missingPages(root)
    if (missing.length) console.warn(`\n⚠ Missing translations in ${root}/:\n${missing.map((path) => `  - ${path}`).join('\n')}\n`)
  }
  check()
  let timer
  // Nuxt restarts in-process on config changes; one watcher, not one per restart.
  globalThis.__contentPairs?.close()
  globalThis.__contentPairs = watch(root, { recursive: true }, () => {
    clearTimeout(timer)
    timer = setTimeout(check, 300)
  })
}
