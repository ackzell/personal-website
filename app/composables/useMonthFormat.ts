/** Formats a `YYYY-MM` month as a short month and year, in the current locale. */
export function useMonthFormat() {
  const { locale } = useI18n()
  const format = computed(() => new Intl.DateTimeFormat(locale.value, { month: 'short', year: 'numeric', timeZone: 'UTC' }))

  return (month: string) => {
    const [year, m] = month.split('-').map(Number)
    return format.value.format(new Date(Date.UTC(year!, m! - 1)))
  }
}
