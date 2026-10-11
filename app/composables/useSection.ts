export type Section = 'about' | 'work' | 'media'

// Route base names (locale suffix stripped) mapped to the section they belong to.
const sectionByRoute: Record<string, Section> = {
  index: 'about',
  projects: 'work',
  'projects-slug': 'work',
  media: 'media',
  videos: 'media',
  podcast: 'media',
}

/**
 * The section the current route belongs to. Drives the stage colors through
 * `data-section` on <html>; see the color tokens in `assets/css/main.css`.
 */
export function useSection() {
  const route = useRoute()
  const routeBaseName = useRouteBaseName()

  return computed<Section>(() => {
    const name = routeBaseName(route)
    return (typeof name === 'string' && sectionByRoute[name]) || 'about'
  })
}
