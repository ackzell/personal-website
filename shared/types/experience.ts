/** One role, with its copy already in the current locale. */
export interface Role {
  /** File name of the role's content. */
  slug: string
  company: string
  url?: string
  /** First and last month, as `YYYY-MM`. */
  start: string
  end: string
  /** Whole months from start to end, counting both. */
  months: number
  role: string
  summary: string[]
  stack: string[]
}
