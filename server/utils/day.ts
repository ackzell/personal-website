/**
 * A timestamp's day, `YYYY-MM-DD`, as it was in Mexico City, where the
 * videos, episodes and merges come from. Cutting the UTC string instead puts
 * an evening release on the next day. Empty when the timestamp can't be read.
 */
export function localDay(timestamp: string) {
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}
