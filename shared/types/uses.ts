/** A tool on the uses page: a row of its category's table. */
export interface UsesTool {
  name: string
  /** The year I started using it. */
  since: number
  until?: number
  url?: string
  /** In the current locale. */
  note?: string
}

/** A kind of thing on the uses page (editor, terminal, hardware): a table. */
export interface UsesCategory {
  slug: string
  /** In the current locale. */
  name: string
  tools: UsesTool[]
}
