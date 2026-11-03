/**
 * My typeof Radio's episodes, newest first, from the podcast's RSS (hosted on
 * Buzzsprout). Generated with the site, like /api/videos.
 *
 * The feed doesn't link to mytypeof.dev; each episode's page there is named
 * after its mp3, minus Buzzsprout's numeric prefix, but not exactly: the site
 * drops the dots and underscores the mp3 turns into dashes, and has numbered
 * one episode differently. So the real names come from the site's sitemap.
 */
const feed = 'https://feeds.buzzsprout.com/1190693.rss'
const site = 'https://mytypeof.dev/episode/'
const sitemap = 'https://mytypeof.dev/sitemap.xml'

// `h:mm:ss`, `m:ss` or plain seconds.
const seconds = (time: string) => time.split(':').reduce((total, part) => total * 60 + Number(part), 0)

const optionalNumber = (value?: string) => (value ? Number(value) : undefined)

const podcastId = 1190693

// Letters and digits only, so `pierbover-com` meets `pierbovercom`.
const squash = (name: string) => name.replace(/[^a-z\d]/gi, '').toLowerCase()

// The name without its `s3-e9-`, for when the site numbered it otherwise.
const subject = (name: string) => squash(name.replace(/^s\d+-e\d+-/, ''))

/**
 * Finds an episode's page on the site, by its name from the mp3. Falls back to
 * the mp3's name when the sitemap can't be read or has nothing like it.
 */
async function pages(): Promise<(id: string) => string> {
  const names = await $fetch<string>(sitemap, { responseType: 'text' })
    .then((xml) => blocks(xml, 'loc').map((loc) => loc.split(site)[1] ?? '').filter(Boolean))
    .catch(() => [] as string[])

  return (id) => names.find((name) => squash(name) === squash(id))
    ?? names.find((name) => subject(name) === subject(id))
    ?? id
}

/**
 * Downloads per episode, by Buzzsprout's episode id (the number the mp3's name
 * starts with). Needs the API key; without one, or if the call fails, the
 * episodes simply carry no counts.
 */
async function downloads(): Promise<Map<string, number>> {
  const { buzzsproutApiKey } = useRuntimeConfig()
  if (!buzzsproutApiKey) return new Map()

  try {
    const episodes = await $fetch<{ id: number | string; total_downloads?: number }[]>(
      `https://www.buzzsprout.com/api/${podcastId}/episodes.json`,
      { headers: { Authorization: `Token token=${buzzsproutApiKey}` } },
    )
    return new Map(episodes.map((episode) => [String(episode.id), episode.total_downloads ?? 0]))
  }
  catch {
    return new Map()
  }
}

export default defineCachedEventHandler(async (): Promise<Episode[]> => {
  const [xml, counts, page] = await Promise.all([$fetch<string>(feed, { responseType: 'text' }), downloads(), pages()])

  return blocks(xml, 'item').map((item) => {
    const audio = attr(item, 'enclosure', 'url') ?? ''
    const file = audio.split('/').pop()!
    const id = file.replace(/^\d+-/, '').replace(/\.mp3$/, '')
    const starts = attrs(item, 'psc:chapter', 'start')
    const titles = attrs(item, 'psc:chapter', 'title')

    return {
      id,
      title: text(item, 'title') ?? '',
      url: site + page(id),
      audio,
      published: localDay(text(item, 'pubDate') ?? ''),
      duration: seconds(text(item, 'itunes:duration') ?? '0'),
      season: optionalNumber(text(item, 'itunes:season')),
      episode: optionalNumber(text(item, 'itunes:episode')),
      downloads: counts.get(file.match(/^\d+/)?.[0] ?? ''),
      chapters: starts.map((start, index) => ({ start: seconds(start), title: titles[index] ?? '' })),
    }
  })
}, { name: 'episodes', maxAge: 60 * 60 })
