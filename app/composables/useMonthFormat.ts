/**
 * Formats a month and year in the current locale: "Apr 2023", or with
 * `long`, "April 2023". Takes a `YYYY-MM` month (a longer ISO date is cut
 * down to its month) or a UTC timestamp, as from `Date.UTC(year, month)`,
 * which also carries a month past December into the next year.
 */
export function useMonthFormat(month: 'short' | 'long' = 'short') {
  const { locale } = useI18n()
  const format = computed(() => new Intl.DateTimeFormat(locale.value, { month, year: 'numeric', timeZone: 'UTC' }))

  return (when: string | number) => {
    if (typeof when === 'number') return format.value.format(when)
    const [year, m] = when.slice(0, 7).split('-').map(Number)
    return format.value.format(new Date(Date.UTC(year!, m! - 1)))
  }
}
