/**
 * View-transition style for a project's Nahuatl word, so the word travels
 * between its lexicon headword and the project heading. The `word` class
 * picks up the word animation in main.css.
 * Names must be unique per page: only one element per slug may carry it.
 * --travel-name (main.css) switches every name off on a section change.
 */
export const wordTransition = (slug: string) => ({
  viewTransitionName: `var(--travel-name, word-${slug})`,
  viewTransitionClass: 'word',
})

/**
 * View-transition style for a project's logo, so the plate travels between
 * its lexicon entry and the project heading, alongside the word. The `plate`
 * class picks up the plate animation in main.css. Same uniqueness rule.
 */
export const plateTransition = (slug: string) => ({
  viewTransitionName: `var(--travel-name, plate-${slug})`,
  viewTransitionClass: 'plate',
})
