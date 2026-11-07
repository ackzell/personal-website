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

/** What the ledger shows: where a project or part lives and what it's made of. */
export interface ProjectFacts {
  repos: string[]
  changelogs: string[]
  links: ProjectLinks
  stack: string[]
  /** YouTube playlist with livestreams / progress updates. */
  devlogPlaylist?: string
}

/** A project as shown in lists and cards: metadata plus copy, without the case study body. */
export interface Project extends ProjectFacts {
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
  related: string[]
  /** The project's mark, a path under public/. Decorative: the word names the project. */
  logo?: string
  /** The mark for the light scheme; `logo` is for the dark one. */
  logoLight?: string
}

/** One part of a project family, with its own page under the project's. */
export interface ProjectPart extends ProjectFacts {
  /** The project it belongs to. */
  parent: string
  slug: string
  title: string
  description: string
  order: number
  /** Project slugs, listed at the end of the part's page. */
  related: string[]
}
