/**
 * Merged pull requests to other people's repositories, joined with their
 * curation (`content/contributions.yml`) and grouped by project. Projects
 * come in order of their newest merge, merges newest first.
 */
export function useContributions() {
  const { locale } = useI18n()

  return useAsyncData(
    () => `contributions-${locale.value}`,
    () => fetchContributions(locale.value),
  )
}

const newestFirst = (a: Contribution, b: Contribution) => b.merged.localeCompare(a.merged)

async function fetchContributions(locale: 'en' | 'es'): Promise<ContributedProject[]> {
  const [merged, curation] = await Promise.all([
    $fetch<Contribution[]>('/api/contributions'),
    queryCollection('contributions').first(),
  ])

  const errata = new Set(curation?.errata)
  const hidden = new Set(curation?.hidden)

  const byRepo = new Map<string, ContributedProject>()
  for (const pr of [...merged].sort(newestFirst)) {
    if (hidden.has(pr.id)) continue
    const project = byRepo.get(pr.repo) ?? { repo: pr.repo, url: `https://github.com/${pr.repo}`, merges: [] }
    project.merges.push({ ...pr, erratum: errata.has(pr.id), note: curation?.notes?.[pr.id]?.[locale] })
    byRepo.set(pr.repo, project)
  }

  // Merges went in newest first, so projects are already in order of their newest.
  return [...byRepo.values()]
}
