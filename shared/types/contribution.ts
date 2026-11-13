/** A merged pull request to someone else's repository. */
export interface Contribution {
  /** `owner/repo#number`, the way `content/contributions.yml` refers to it. */
  id: string
  /** `owner/repo`. */
  repo: string
  number: number
  title: string
  url: string
  /** Merge date, as `YYYY-MM-DD`. */
  merged: string
  /** A typo, a link added to a list or another small fix; shown muted and optional. */
  erratum?: boolean
  /** A line about it in the current locale, from `content/contributions.yml`. */
  note?: string
}

/** A repository with the contributions merged into it, newest first. */
export interface ContributedProject {
  repo: string
  url: string
  merges: Contribution[]
}
