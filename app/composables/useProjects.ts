/**
 * Projects, joined from language-agnostic metadata (`content/projects/<slug>.yml`)
 * and the copy for the current locale (`content/<locale>/projects/<slug>.md`).
 * Sorted by `order`. Case study bodies are left out so list pages stay light;
 * use `useProjectPage` for a single body.
 */
export function useProjects() {
  const { locale } = useI18n()

  return useAsyncData(
    () => `projects-${locale.value}`,
    () => fetchProjects(locale.value),
  )
}

/** The case study body for one project, in the current locale. */
export function useProjectPage(slug: MaybeRefOrGetter<string>) {
  const { locale } = useI18n()

  return useAsyncData(
    () => `project-page-${locale.value}-${toValue(slug)}`,
    () => queryCollection(`projects_${locale.value}`).path(`/projects/${toValue(slug)}`).first(),
  )
}

/** A project's parts (`content/projects/<slug>/<part>.yml`), sorted by `order`. */
export function useProjectParts(slug: MaybeRefOrGetter<string>) {
  const { locale } = useI18n()

  return useAsyncData(
    () => `project-parts-${locale.value}-${toValue(slug)}`,
    () => fetchParts(locale.value, toValue(slug)),
  )
}

/** Every project's parts, sorted by `order` within each project. */
export function useAllProjectParts() {
  const { locale } = useI18n()

  return useAsyncData(
    () => `project-parts-${locale.value}`,
    () => fetchParts(locale.value),
  )
}

/** The body of one part's page, in the current locale. */
export function useProjectPartPage(slug: MaybeRefOrGetter<string>, part: MaybeRefOrGetter<string>) {
  const { locale } = useI18n()

  return useAsyncData(
    () => `project-part-page-${locale.value}-${toValue(slug)}-${toValue(part)}`,
    () => queryCollection(`parts_${locale.value}`).path(`/projects/${toValue(slug)}/${toValue(part)}`).first(),
  )
}

const slugOf = (stem: string) => stem.split('/').pop()!

async function fetchProjects(locale: 'en' | 'es'): Promise<Project[]> {
  const [meta, copy] = await Promise.all([
    queryCollection('projectsMeta').all(),
    queryCollection(`projects_${locale}`).select('stem', 'title', 'description', 'meaning').all(),
  ])

  const copyBySlug = new Map(copy.map((page) => [slugOf(page.stem), page]))

  return meta
    .map((item): Project => {
      const slug = slugOf(item.stem)
      const page = copyBySlug.get(slug)
      // A missing translation should break the build, not silently drop a project.
      if (!page) {
        throw new Error(`Project "${slug}" has no ${locale} copy in content/${locale}/projects/`)
      }

      return {
        slug,
        word: slug,
        pronunciation: item.pronunciation,
        meaning: page.meaning,
        title: page.title,
        description: page.description,
        status: item.status,
        featured: item.featured ?? false,
        order: item.order,
        repos: item.repos ?? [],
        links: item.links ?? {},
        stack: item.stack ?? [],
        related: item.related ?? [],
        devlogPlaylist: item.devlogPlaylist,
        logo: item.logo,
        logoLight: item.logoLight,
      }
    })
    .sort((a, b) => a.order - b.order)
}

/** A project's parts, or every project's when no `parent` is given. */
async function fetchParts(locale: 'en' | 'es', parent?: string): Promise<ProjectPart[]> {
  const [meta, copy] = await Promise.all([
    queryCollection('partsMeta').all(),
    queryCollection(`parts_${locale}`).select('stem', 'title', 'description').all(),
  ])

  const parentOf = (stem: string) => stem.split('/').at(-2)!
  const inParent = (stem: string) => !parent || parentOf(stem) === parent
  // Keyed by parent and slug: two projects may each have a part of one name.
  const keyOf = (stem: string) => `${parentOf(stem)}/${slugOf(stem)}`
  const copyByKey = new Map(copy.filter((page) => inParent(page.stem)).map((page) => [keyOf(page.stem), page]))

  return meta
    .filter((item) => inParent(item.stem))
    .map((item): ProjectPart => {
      const slug = slugOf(item.stem)
      const page = copyByKey.get(keyOf(item.stem))
      if (!page) {
        throw new Error(`Part "${keyOf(item.stem)}" has no ${locale} copy in content/${locale}/projects/${parentOf(item.stem)}/`)
      }

      return {
        parent: parentOf(item.stem),
        slug,
        title: page.title,
        description: page.description,
        order: item.order,
        repos: item.repos ?? [],
        links: item.links ?? {},
        stack: item.stack ?? [],
        devlogPlaylist: item.devlogPlaylist,
      }
    })
    .sort((a, b) => a.order - b.order)
}
