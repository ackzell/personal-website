/** A video's still on YouTube's image host, at one of the sizes it serves. */
export const youtubeStill = (id: string, size: 'mqdefault' | 'hqdefault' | 'maxresdefault' = 'mqdefault') =>
  `https://i.ytimg.com/vi/${id}/${size}.jpg`

/** A video's own page on YouTube. */
export const youtubeWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`
