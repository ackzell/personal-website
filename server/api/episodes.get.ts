/**
 * My typeof Radio's episodes, newest first, from the podcast's RSS (hosted on
 * Buzzsprout). Generated with the site, like /api/videos.
 *
 * The feed doesn't link to mytypeof.dev; each episode's page there is named
 * after its mp3, minus Buzzsprout's numeric prefix.
 */
const feed = 'https://feeds.buzzsprout.com/1190693.rss'
const site = 'https://mytypeof.dev/episode/'

// `h:mm:ss`, `m:ss` or plain seconds.
const seconds = (time: string) => time.split(':').reduce((total, part) => total * 60 + Number(part), 0)

const optionalNumber = (value?: string) => (value ? Number(value) : undefined)

const podcastId = 1190693

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
  const [xml, counts] = await Promise.all([$fetch<string>(feed, { responseType: 'text' }), downloads()])

  return blocks(xml, 'item').map((item) => {
    const audio = attr(item, 'enclosure', 'url') ?? ''
    const file = audio.split('/').pop()!
    const id = file.replace(/^\d+-/, '').replace(/\.mp3$/, '')
    const starts = attrs(item, 'psc:chapter', 'start')
    const titles = attrs(item, 'psc:chapter', 'title')

    return {
      id,
      title: text(item, 'title') ?? '',
      url: site + id,
      audio,
      published: new Date(text(item, 'pubDate') ?? '').toISOString().slice(0, 10),
      duration: seconds(text(item, 'itunes:duration') ?? '0'),
      season: optionalNumber(text(item, 'itunes:season')),
      episode: optionalNumber(text(item, 'itunes:episode')),
      downloads: counts.get(file.match(/^\d+/)?.[0] ?? ''),
      chapters: starts.map((start, index) => ({ start: seconds(start), title: titles[index] ?? '' })),
    }
  })
}, { name: 'episodes', maxAge: 60 * 60 })
