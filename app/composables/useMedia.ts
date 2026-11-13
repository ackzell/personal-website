/**
 * What the media pages read: the playlists and the podcast's seasons, as the
 * rows of a guide (GuideSeries), joined with the lines I wrote about them in
 * `content/media.yml`.
 */

/**
 * The video side of the guide: one row per playlist in `content/media.yml`,
 * in the order listed there. A playlist feed that fails to load drops its row
 * instead of the page.
 */
export function useVideoSeries() {
  const { locale } = useI18n()

  return useAsyncData(
    () => `video-series-${locale.value}`,
    async (): Promise<GuideSeries[]> => {
      const curation = await queryCollection('media').first()

      const playlists = await Promise.all(
        (curation?.series ?? []).map(async (entry): Promise<GuideSeries | undefined> => {
          const videos = await $fetch<Video[]>(`/api/playlists/${entry.playlist}`, { responseType: 'json' }).catch(() => [])
          if (!videos.length) return undefined
          return {
            id: entry.playlist,
            kind: 'playlist',
            title: entry.title,
            url: `https://www.youtube.com/playlist?list=${entry.playlist}`,
            note: entry.note[locale.value],
            project: entry.project,
            releases: videos,
            // The public feed stops at 15; the API (lengths present) doesn't.
            capped: videos.length >= 15 && videos.every((video) => video.duration === undefined),
          }
        }),
      )

      return playlists.filter((series) => series !== undefined)
    },
  )
}

/**
 * The podcast side: one row per season, newest first. An episode with no
 * season (the trailer) rides with the season that was airing on its date.
 */
export function usePodcastSeasons() {
  const { locale, t } = useI18n()

  return useAsyncData(
    () => `podcast-seasons-${locale.value}`,
    async () => {
      const [curation, episodes] = await Promise.all([
        queryCollection('media').first(),
        $fetch<Episode[]>('/api/episodes', { responseType: 'json' }),
      ])

      const seasoned = episodes.filter((episode) => episode.season)
      const seasonOf = (episode: Episode) => episode.season
        // Newest first, so the first one out by then is the latest season to have aired.
        ?? seasoned.find((other) => other.published <= episode.published)?.season
        ?? seasoned.at(-1)?.season ?? 1

      const bySeason = new Map<number, Episode[]>()
      for (const episode of episodes) {
        const season = seasonOf(episode)
        bySeason.set(season, [...(bySeason.get(season) ?? []), episode])
      }

      const seasons: GuideSeries[] = [...bySeason]
        .sort(([a], [b]) => b - a)
        .map(([season, releases]) => ({
          id: `season-${season}`,
          kind: 'podcast',
          title: t('media.guide.season', { n: season }),
          url: 'https://mytypeof.dev',
          releases,
          capped: false,
        }))

      return { note: curation?.podcast?.note[locale.value], seasons }
    },
  )
}
