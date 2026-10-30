export type Section = 'about' | 'work' | 'media'

/** Flag order, left to right. Page transitions travel along it. */
export const sectionOrder: readonly Section[] = ['about', 'work', 'media']

// Route base names (locale suffix stripped) mapped to the section they belong to.
const sectionByRoute: Record<string, Section> = {
  index: 'about',
  contributions: 'about',
  uses: 'about',
  projects: 'work',
  'projects-slug': 'work',
  'projects-slug-part': 'work',
  media: 'media',
  videos: 'media',
  podcast: 'media',
}

/** Section for a route base name (locale suffix already stripped). */
export function sectionOf(routeBaseName: unknown): Section {
  return (typeof routeBaseName === 'string' && sectionByRoute[routeBaseName]) || 'about'
}

/**
 * The section the current route belongs to. Drives the stage colors through
 * `data-section` on <html>; see the color tokens in `assets/css/main.css`.
 */
export function useSection() {
  const route = useRoute()
  const routeBaseName = useRouteBaseName()

  return computed<Section>(() => sectionOf(routeBaseName(route)))
}
