export type ProjectStatus = 'shipped' | 'active' | 'experiment'

export interface ProjectLinks {
  site?: string
  video?: string
  marketplace?: string
  openvsx?: string
  release?: string
  /** How to ask for access to an invite-only preview. Never the preview URL itself. */
  previewAccess?: string
}

/** A project as shown in lists and cards: metadata plus copy, without the case study body. */
export interface Project {
  /** File name of the project's content; also the Nahuatl word it's named after. */
  slug: string
  word: string
  pronunciation: string
  meaning: string
  title: string
  description: string
  status: ProjectStatus
  featured: boolean
  order: number
  repos: string[]
  links: ProjectLinks
  stack: string[]
  related: string[]
  /** YouTube playlist with livestreams / progress updates. */
  devlogPlaylist?: string
  /** The project's mark, a path under public/. Decorative: the word names the project. */
  logo?: string
  /** The mark for the light scheme; `logo` is for the dark one. */
  logoLight?: string
}
