// The dev warning for pages missing in one locale (scripts/content-pairs.mjs).
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { missingPages } from '../scripts/content-pairs.mjs'

function tree(files: string[]) {
  const root = mkdtempSync(join(tmpdir(), 'content-'))
  for (const file of files) {
    mkdirSync(join(root, file, '..'), { recursive: true })
    writeFileSync(join(root, file), '')
  }
  return root
}

test('the real content has every page in both locales', () => {
  assert.deepEqual(missingPages(), [])
})

test('a page in one locale only is reported for the other', () => {
  const root = tree(['en/projects/a.md', 'es/projects/a.md', 'en/projects/a/b.md'])
  assert.deepEqual(missingPages(root), ['es/projects/a/b.md'])
})

test('a part with data but no pages is reported for both', () => {
  const root = tree(['projects/a/b.yml'])
  assert.deepEqual(missingPages(root), ['en/projects/a/b.md', 'es/projects/a/b.md'])
})
