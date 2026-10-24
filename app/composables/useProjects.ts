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
