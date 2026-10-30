import { mainNav } from '~/config/nav'

/**
 * The flag band's stops in order, left to right: each section, then the
 * pages under it (projects under Work, the children under Media). Swipes walk
 * them; a page change comes in from the side its page lies on along them.
 */
export function useNavStops() {
  const localePath = useLocalePath()
  const { data: projects } = useProjects()

  const stops = computed(() =>
    mainNav.flatMap((item) => [
      item.to,
      ...(item.section === 'work' ? (projects.value ?? []).map((project) => `/projects/${project.slug}`) : []),
      ...('children' in item ? item.children.map((child) => child.to) : []),
    ]),
  )

  const stripSlash = (path: string) => (path.length > 1 ? path.replace(/\/$/, '') : path)

  /** Where a path stands among the stops, or -1 when it's none of them. */
  const indexOf = (path: string) => stops.value.findIndex((to) => stripSlash(localePath(to)) === stripSlash(path))

  return { stops, indexOf }
}
