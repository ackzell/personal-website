/** A video from a playlist's feed (the latest 15). */
export interface Video {
  /** YouTube's video id. */
  id: string
  title: string
  url: string
  /** Publish date, as `YYYY-MM-DD`. */
  published: string
  /** Length in seconds; only with a YouTube API key. */
  duration?: number
  /** View count; only with a YouTube API key. */
  views?: number
}

/** A chapter mark inside an episode, from the feed. */
export interface Chapter {
  /** Seconds from the start. */
  start: number
  title: string
}

/** A My typeof Radio episode, from the podcast's RSS. */
export interface Episode {
  /** The episode's slug on mytypeof.dev. */
  id: string
  title: string
  /** Its page on mytypeof.dev. */
  url: string
  /** The mp3. */
  audio: string
  /** Publish date, as `YYYY-MM-DD`. */
  published: string
  /** Length in seconds. */
  duration: number
  season?: number
  episode?: number
  chapters: Chapter[]
  /** Total downloads, from Buzzsprout's API; absent when no key is set. */
  downloads?: number
}

/** One release on the guide: a video of a playlist, or an episode. */
export interface GuideRelease {
  id: string
  title: string
  url: string
  /** Publish date, as `YYYY-MM-DD`. */
  published: string
  /** Episodes only, in seconds. */
  duration?: number
  downloads?: number
  /** Videos only. */
  views?: number
}

/** A row of the guide on /content: a playlist or the podcast, with its releases. */
export interface GuideSeries {
  id: string
  kind: 'playlist' | 'podcast'
  title: string
  /** Where the rest of it lives. */
  url: string
  /** The line about it in the current locale, when there is one. */
  note?: string
  project?: string
  releases: GuideRelease[]
  /** The feed only reaches back 15 videos, so the count is a floor. */
  capped: boolean
}
