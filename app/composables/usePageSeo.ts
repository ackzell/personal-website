/** A project's dictionary line, set on its social card. */
interface CardEntry {
  pronunciation?: string
  meaning?: string
  /** The card's heading, when shorter than the page title. */
  heading?: string
  /** The project a part belongs to, above its heading. */
  parent?: string
}

/**
 * A page's title, description and social card. Crawlers only read the
 * prerendered HTML, so the card takes the values as they are on the server.
 */
export function usePageSeo(seo: () => { title?: string; description?: string; entry?: CardEntry }) {
  const section = useSection()

  useSeoMeta({
    title: () => seo().title,
    description: () => seo().description || undefined,
    ogTitle: () => seo().title,
    ogDescription: () => seo().description || undefined,
  })

  const { title, entry: { heading, ...entry } = {} } = seo()
  defineOgImage('Page.takumi', { title: heading ?? title, section: section.value, ...entry }, { height: 630 })
}
