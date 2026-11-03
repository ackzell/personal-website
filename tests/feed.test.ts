// The feed parser behind the podcast and video pages (server/utils/feed.ts),
// on markup shaped like the feeds it reads. Run with `pnpm test`.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { attr, attrs, blocks, text } from '../server/utils/feed.ts'

const rss = `<rss><channel><title>Show</title>
<item>
  <itunes:title>Not this one</itunes:title>
  <title><![CDATA[Vue & Nuxt, ep. 1]]></title>
  <description>Tom &amp; Jerry&#x27;s &#8220;talk&#8221; &unknown;</description>
  <enclosure url="https://example.com/123-s1-e1-vue.mp3?a=1&amp;b=2" length="1" type="audio/mpeg" />
  <psc:chapter start="0" title="Intro"/>
  <psc:chapter start="1:02:03" title="Q &amp; A"/>
</item>
<item><title>Second</title></item>
</channel></rss>`

test('blocks finds every item, not the channel title', () => {
  const items = blocks(rss, 'item')
  assert.equal(items.length, 2)
  assert.equal(text(items[1]!, 'title'), 'Second')
})

test('text unwraps CDATA and decodes entities, skipping prefixed tags', () => {
  const [item] = blocks(rss, 'item')
  assert.equal(text(item!, 'title'), 'Vue & Nuxt, ep. 1')
  assert.equal(text(item!, 'description'), 'Tom & Jerry\'s “talk” &unknown;')
  assert.equal(text(item!, 'missing'), undefined)
})

test('attr reads self-closing tags and decodes the value', () => {
  const [item] = blocks(rss, 'item')
  assert.equal(attr(item!, 'enclosure', 'url'), 'https://example.com/123-s1-e1-vue.mp3?a=1&b=2')
  assert.equal(attr(item!, 'enclosure', 'missing'), undefined)
})

test('attrs keeps every tag in order', () => {
  const [item] = blocks(rss, 'item')
  assert.deepEqual(attrs(item!, 'psc:chapter', 'start'), ['0', '1:02:03'])
  assert.deepEqual(attrs(item!, 'psc:chapter', 'title'), ['Intro', 'Q & A'])
})
