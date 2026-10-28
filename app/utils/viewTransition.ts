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
 * View-transition style for a part's name, so it travels between its row in
 * a parts list and the part's heading. Both render at --subentry-size, so it
 * rides the word animation as a pure move. Same uniqueness rule: a part page
 * leaves itself out of its siblings list.
 */
export const partTransition = (parent: string, slug: string) => ({
  viewTransitionName: `var(--travel-name, part-${parent}-${slug})`,
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

/**
 * View-transition style for a media section's name (Videos, Podcast), so it
 * travels between its door on the hub and the section's heading. Both render
 * at --headword-size, like a project's word. Same uniqueness rule.
 */
export const mediaTransition = (slug: 'videos' | 'podcast') => ({
  viewTransitionName: `var(--travel-name, media-${slug})`,
  viewTransitionClass: 'word',
})
