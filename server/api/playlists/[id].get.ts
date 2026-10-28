/**
 * A playlist's videos (a project's devlog, from its `devlogPlaylist`), in
 * playlist order; with a YouTube API key, all of them with lengths and views. Generated with the site, like /api/videos.
 */
export default defineCachedEventHandler(
  (event) => youtubePlaylist(getRouterParam(event, 'id')!),
  { name: 'playlist', maxAge: 60 * 60, getKey: (event) => getRouterParam(event, 'id')! },
)
