/**
 * A figure is a number and its unit, split out of the message that says both
 * ("{count} views"), so each language keeps its own plural and word order.
 * A soft figure (a date) frames the others rather than being read (GuideFigures).
 */
export type GuideFigure = { value: string, unit?: string, soft?: boolean }

const MARK = '\u0001'

/** The media guide's dates and figures, in the current locale. */
export function useGuideFigures() {
  const { t, n, locale } = useI18n()

  const dateFormat = computed(() => new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }))
  const formatDate = (date: string) => dateFormat.value.format(new Date(`${date}T00:00:00Z`))

  function figure(key: string, value: string, plural: number): GuideFigure {
    const unit = t(key, { count: MARK }, plural).replace(MARK, '').trim()
    return { value, unit }
  }

  // A release's figures, in a fixed order: its place in the playlist, when, how
  // long, how many watched or downloaded.
  function figures(release: GuideRelease, number?: number): GuideFigure[] {
    return [
      ...(number ? [{ value: `#${number}` }] : []),
      { value: formatDate(release.published), soft: true },
      ...(release.duration ? [{ value: formatClock(release.duration) }] : []),
      ...(release.views ? [figure('media.guide.views', n(release.views), release.views)] : []),
      ...(release.downloads ? [figure('media.guide.downloads', n(release.downloads), release.downloads)] : []),
    ]
  }

  return { formatDate, figure, figures }
}
