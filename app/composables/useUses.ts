/** The uses page's categories from `content/uses.yml`, in the current locale. */
export function useUses() {
  const { locale } = useI18n()

  return useAsyncData(
    () => `uses-${locale.value}`,
    () => fetchUses(locale.value),
  )
}

export async function fetchUses(locale: 'en' | 'es'): Promise<UsesCategory[]> {
  const file = await queryCollection('uses').first()

  return (file?.categories ?? []).map((category) => ({
    slug: category.slug,
    name: category.name[locale],
    tools: category.tools.map(({ note, ...tool }) => ({ ...tool, note: note?.[locale] || undefined })),
  }))
}
