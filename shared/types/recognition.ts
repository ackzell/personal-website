/** One award or certification, with its copy already in the current locale. */
export interface Recognition {
  /** File name of the entry's content. */
  slug: string
  kind: 'award' | 'certification'
  title: string
  /** What the entry is called where room is short (an acronym, a name). */
  short: string
  issuer: string
  /** Month earned and, for a certification, the month it lapsed, as `YYYY-MM`. */
  start: string
  end?: string
  /** Whole months held, counting both ends; 1 for an award. */
  months: number
  detail?: string
  /** Areas scored outstanding, out of the areas evaluated. */
  score?: [number, number]
}
