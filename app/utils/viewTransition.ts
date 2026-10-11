/**
 * View-transition style for a project's Nahuatl word, so the word travels
 * between its lexicon headword and the project heading. The `word` class
 * picks up the word animation in main.css.
 * Names must be unique per page: only one element per slug may carry it.
 */
export const wordTransition = (slug: string) => ({
  viewTransitionName: `word-${slug}`,
  viewTransitionClass: 'word',
})
