/**
 * Amoxtli's table of contents, from its markdown sources: the pages of
 * `content/<locale>/<chapter>/`, sorted and titled as its own menu sorts and
 * titles them. A chapter's intro page only names the chapter, as a lesson it
 * would just repeat the name.
 */
const LOCALES = { en: 'en', es_mx: 'es' } as const

// A chapter's intro or a lesson in its own folder, either named `index.md` or
// `03.index.md`; names starting with a dot (`.template`) are scaffolding.
const PAGE = /^content\/(en|es_mx)\/([^/.][^/]*)\/(?:([^/.][^/]*)\/)?(?:\d+\.)?index\.md$/

export const isBookPage = (path: string) => PAGE.test(path)

// `01.the-intro` reads "The intro", for what has no title of its own.
function fromFolder(name: string) {
  const words = name.replace(/^\d+\w?\./, '').replaceAll('-', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// Nuxt Content's own fallback: the frontmatter's title, or else the first heading.
function titleOf(source: string) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
  const title = frontmatter.match(/^title:\s*(.+?)\s*$/m)?.[1]?.replace(/^(["'])(.*)\1$/, '$2')
  return title || source.match(/^# (.+?)\s*$/m)?.[1]?.replaceAll('`', '')
}

export function bookChapters(pages: { path: string, source: string }[]): BookChapters {
  const found = { en: new Map<string, BookChapter>(), es: new Map<string, BookChapter>() }
  // Numerically, with a lettered step (`02a`) after its number; then a Map keeps that order.
  const sorted = pages.toSorted((a, b) => a.path.localeCompare(b.path, 'en', { numeric: true }))

  for (const { path, source } of sorted) {
    const [, folder, name, lesson] = path.match(PAGE) ?? []
    if (!folder || !name) continue
    const chapters = found[LOCALES[folder as keyof typeof LOCALES]]
    const chapter = chapters.get(name) ?? { title: fromFolder(name), lessons: [] }
    chapters.set(name, chapter)
    if (lesson) chapter.lessons.push({ title: titleOf(source) ?? fromFolder(lesson), challenge: /^isChallenge:\s*true\s*$/m.test(source) })
    else chapter.title = titleOf(source) ?? chapter.title
  }

  return { en: [...found.en.values()], es: [...found.es.values()] }
}
