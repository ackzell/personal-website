// Amoxtli's table of contents from its sources (server/utils/bookChapters.ts),
// on files shaped like its content folder. Run with `pnpm test`.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bookChapters, isBookPage } from '../server/utils/bookChapters.ts'

const page = (path: string, frontmatter: string, body = '') => ({
  path: `content/${path}`,
  source: `---\n${frontmatter}\n---\n\n${body}`,
})

test('isBookPage takes intros and lessons, not the welcome page or scaffolding', () => {
  for (const path of ['05.x/index.md', '02.x/02.index.md', '05.x/02.v-on/index.md', '02.x/03.installing/03.index.md'])
    assert.ok(isBookPage(`content/en/${path}`), path)
  for (const path of ['0.index.md', '05.x/.template/index.md', '.template/x/index.md', '05.x/01.y/.template/index.md', '05.x/01.y/notes.md'])
    assert.ok(!isBookPage(`content/en/${path}`), path)
  assert.ok(!isBookPage('docs/05.x/02.v-on/index.md'))
})

test('sorts as the menu does: numerically, with a lettered step after its number', () => {
  const { en } = bookChapters([
    page('en/10.last/index.md', 'title: Last'),
    page('en/02.basics/10.recap/index.md', 'title: Recap'),
    page('en/02.basics/02a.more/index.md', 'title: More'),
    page('en/02.basics/02.first/index.md', 'title: First'),
    page('en/02.basics/09.index.md', 'title: "Basics: all of it"'),
  ])
  assert.deepEqual(en.map((chapter) => chapter.title), ['Basics: all of it', 'Last'])
  assert.deepEqual(en[0]!.lessons.map((lesson) => lesson.title), ['First', 'More', 'Recap'])
})

test('falls back to the first heading, then the folder, as the menu does', () => {
  const { en } = bookChapters([
    page('en/01.the-intro/01.context/index.md', 'ogImage: true', '# `Context`\n\n# Not this'),
    page('en/01.the-intro/02.some-history/index.md', 'ogImage: true', 'No heading.'),
  ])
  assert.equal(en[0]!.title, 'The intro')
  assert.deepEqual(en[0]!.lessons.map((lesson) => lesson.title), ['Context', 'Some history'])
})

test('reads only the frontmatter title, and flags challenges', () => {
  const { en } = bookChapters([
    page('en/01.x/01.a/index.md', 'title: A\nisChallenge: true'),
    page('en/01.x/02.b/index.md', 'ogImage: true', 'title: not this\n\n# B'),
  ])
  assert.deepEqual(en[0]!.lessons, [{ title: 'A', challenge: true }, { title: 'B', challenge: false }])
})

test('keeps each language to the pages written in it', () => {
  const { en, es } = bookChapters([
    page('en/01.x/01.a/index.md', 'title: A'),
    page('en/01.x/02.b/index.md', 'title: B'),
    page('es_mx/01.x/01.a/index.md', 'title: Á'),
  ])
  assert.equal(en[0]!.lessons.length, 2)
  assert.deepEqual(es[0]!.lessons, [{ title: 'Á', challenge: false }])
})
