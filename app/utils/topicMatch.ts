const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Whether every word of `query` turns up somewhere in `texts`, ignoring case and accents. */
export function matchesTopic(query: string, texts: string[]): boolean {
  const haystack = fold(texts.join(' '))
  return fold(query).split(/\s+/).filter(Boolean).every((word) => haystack.includes(word))
}
