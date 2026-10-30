import { mainNav } from '~/config/nav'
import type { Section } from '~/composables/useSection'

export interface NavStop {
  to: string
  /** The name the flag band gives it. */
  label: string
  lang?: string
  /** The project a part is under, by its word. */
  parent?: string
  section: Section
}

/**
 * The flag band's stops in order, left to right: each section, then the
 * pages under it (projects under Work, each followed by its parts; the
 * children under About and Media). Swipes, the arrow keys and the next stop
 * at a page's foot walk them; a page change comes in from the side its page
 * lies on along them.
 */
export function useNavStops() {
  const { t } = useI18n()
  const localePath = useLocalePath()
  const { data: projects } = useProjects()
  const { data: parts } = useAllProjectParts()

  const stops = computed<NavStop[]>(() =>
    mainNav.flatMap((item) => [
      { to: item.to, label: t(`nav.${item.key}`), section: item.section },
      ...(item.section === 'work' ? projects.value ?? [] : []).flatMap((project) => [
        { to: `/projects/${project.slug}`, label: project.word, lang: 'nah', section: item.section },
        ...(parts.value ?? []).filter((part) => part.parent === project.slug).map((part) => ({
          to: `/projects/${project.slug}/${part.slug}`,
          label: part.title,
          parent: project.word,
          section: item.section,
        })),
      ]),
      ...('children' in item ? item.children : []).map((child) => ({
        to: child.to,
        label: t(`${child.key}.title`),
        section: item.section,
      })),
    ]),
  )

  const stripSlash = (path: string) => (path.length > 1 ? path.replace(/\/$/, '') : path)

  /** Where a path stands among the stops, or -1 when it's none of them. */
  const indexOf = (path: string) => stops.value.findIndex(({ to }) => stripSlash(localePath(to)) === stripSlash(path))

  /** The stop `by` along from a path, if it's on the band and there is one. */
  const from = (path: string, by: 1 | -1) => {
    const i = indexOf(path)
    return i === -1 ? undefined : stops.value[i + by]
  }

  return { stops, indexOf, from }
}
