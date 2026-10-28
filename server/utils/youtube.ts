/**
 * YouTube's public feeds: no key and no quota, but only the latest 15 videos
 * and no durations. Enough for a guide that draws each playlist as a strip.
 */
async function youtubeFeed(query: { playlist_id: string }): Promise<Video[]> {
  const xml = await $fetch<string>('https://www.youtube.com/feeds/videos.xml', { query, responseType: 'text' })

  return blocks(xml, 'entry').map((entry) => {
    const id = text(entry, 'yt:videoId')!
    return {
      id,
      title: text(entry, 'title') ?? '',
      url: `https://www.youtube.com/watch?v=${id}`,
      published: (text(entry, 'published') ?? '').slice(0, 10),
    }
  })
}

interface PlaylistItems {
  nextPageToken?: string
  items: { contentDetails: { videoId: string, videoPublishedAt?: string }, snippet: { title: string } }[]
}

interface VideoDetails {
  items: { id: string, contentDetails: { duration: string }, statistics: { viewCount?: string } }[]
}

// ISO 8601 length, `PT1H2M10S`, in seconds.
function isoSeconds(duration: string) {
  const [, h = 0, m = 0, s = 0] = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/) ?? []
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

/**
 * A playlist's videos. With the API key: every one, with its length and views
 * (a few quota units per playlist, and the page is generated once). Without
 * one, or if the API fails, the public feed's latest 15.
 */
export async function youtubePlaylist(playlistId: string): Promise<Video[]> {
  const { youtubeApiKey: key } = useRuntimeConfig()
  if (!key) return youtubeFeed({ playlist_id: playlistId })

  try {
    const api = 'https://www.googleapis.com/youtube/v3'
    const entries: PlaylistItems['items'] = []
    let pageToken: string | undefined
    do {
      const page: PlaylistItems = await $fetch(`${api}/playlistItems`, {
        query: { part: 'snippet,contentDetails', playlistId, maxResults: 50, pageToken, key },
      })
      entries.push(...page.items)
      pageToken = page.nextPageToken
    } while (pageToken)

    const details = new Map<string, VideoDetails['items'][number]>()
    for (let i = 0; i < entries.length; i += 50) {
      const { items } = await $fetch<VideoDetails>(`${api}/videos`, {
        query: { part: 'contentDetails,statistics', id: entries.slice(i, i + 50).map((entry) => entry.contentDetails.videoId).join(','), key },
      })
      for (const item of items) details.set(item.id, item)
    }

    // Private and deleted videos stay in a playlist but come back with no details.
    return entries.flatMap(({ contentDetails: { videoId: id, videoPublishedAt }, snippet }) => {
      const video = details.get(id)
      if (!video || !videoPublishedAt) return []
      return [{
        id,
        title: snippet.title,
        url: `https://www.youtube.com/watch?v=${id}`,
        published: videoPublishedAt.slice(0, 10),
        duration: isoSeconds(video.contentDetails.duration),
        views: video.statistics.viewCount === undefined ? undefined : Number(video.statistics.viewCount),
      }]
    })
  }
  catch {
    return youtubeFeed({ playlist_id: playlistId })
  }
}
