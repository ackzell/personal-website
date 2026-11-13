/**
 * Awards and certifications from `content/recognition/<slug>.yml`, in the
 * current locale: awards first, then newest first.
 */
export function useRecognition() {
  const { locale } = useI18n()

  return useAsyncData(
    () => `recognition-${locale.value}`,
    () => fetchRecognition(locale.value),
  )
}

async function fetchRecognition(locale: 'en' | 'es'): Promise<Recognition[]> {
  const items = await queryCollection('recognition').all()

  return items
    .map((item): Recognition => ({
      slug: item.stem.split('/').pop()!,
      kind: item.kind,
      title: item.title[locale],
      short: item.short,
      issuer: item.issuer,
      start: item.start,
      end: item.end,
      months: item.end ? monthIndex(item.end) - monthIndex(item.start) + 1 : 1,
      detail: item.detail?.[locale],
      score: item.score,
    }))
    .sort((a, b) => a.kind.localeCompare(b.kind) || b.start.localeCompare(a.start))
}
