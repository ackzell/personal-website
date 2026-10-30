/** The uses page's categories from `content/uses.yml`, in the current locale. */
export function useUses() {
  const { locale } = useI18n()

  return useAsyncData(
    () => `uses-${locale.value}`,
    async (): Promise<UsesCategory[]> => {
      const file = await queryCollection('uses').first()

      return (file?.categories ?? []).map((category) => ({
        slug: category.slug,
        name: category.name[locale.value],
        tools: category.tools.map(({ note, ...tool }) => ({ ...tool, note: note?.[locale.value] || undefined })),
      }))
    },
  )
}
