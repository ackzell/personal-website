/**
 * Roles from `content/experience/<slug>.yml`, in the current locale, newest
 * first.
 */
export function useExperience() {
  const { locale } = useI18n()

  return useAsyncData(
    () => `experience-${locale.value}`,
    () => fetchExperience(locale.value),
  )
}

async function fetchExperience(locale: 'en' | 'es'): Promise<Role[]> {
  const items = await queryCollection('experience').all()

  return items
    .map((item): Role => ({
      slug: item.stem.split('/').pop()!,
      company: item.company,
      url: item.url,
      start: item.start,
      end: item.end,
      months: monthIndex(item.end) - monthIndex(item.start) + 1,
      role: item.role[locale],
      summary: item.summary[locale],
      stack: item.stack ?? [],
    }))
    .sort((a, b) => b.start.localeCompare(a.start))
}
