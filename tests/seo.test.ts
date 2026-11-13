// Every generated page is ready to be found and shared. Needs `nuxt generate`.
import assert from 'node:assert/strict'
import { existsSync, globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

const root = '.output/public'
const built = existsSync(join(root, '200.html'))
const meta = (html: string, name: string) =>
  html.match(new RegExp(`<meta[^>]*(?:name|property)="${name}"[^>]*content="([^"]*)"`))?.[1]

test('every page has its head tags and a card on disk', { skip: !built }, () => {
  const problems: string[] = []
  for (const file of globSync('**/index.html', { cwd: root })) {
    const html = readFileSync(join(root, file), 'utf8')
    const description = meta(html, 'description')
    const card = meta(html, 'og:image')
    if (!description) problems.push(`${file}: no description`)
    else if (description.length > 160) problems.push(`${file}: description is ${description.length} characters`)
    if (!meta(html, 'og:title')) problems.push(`${file}: no og:title`)
    if (!meta(html, 'twitter:card')) problems.push(`${file}: no twitter:card`)
    if (!html.includes('rel="canonical"')) problems.push(`${file}: no canonical`)
    if (!card?.startsWith('https://') || !existsSync(join(root, new URL(card).pathname))) problems.push(`${file}: no card (${card})`)
  }
  assert.deepEqual(problems, [])
})

test('the sitemaps list exactly the generated pages', { skip: !built }, () => {
  const listed = globSync('__sitemap__/*.xml', { cwd: root })
    .flatMap((file) => [...readFileSync(join(root, file), 'utf8').matchAll(/<loc>https:\/\/ackzell\.dev([^<]*)<\/loc>/g)])
    .map(([, path]) => path || '/')
  // Pages build as name.html (autoSubfolderIndex: false); 200/404 are fallbacks, not pages.
  const pages = globSync('**/*.html', { cwd: root, exclude: ['200.html', '404.html'] })
    .map((file) => `/${file.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '')}`)
  assert.deepEqual([...new Set(listed)].sort(), pages.sort())
})
