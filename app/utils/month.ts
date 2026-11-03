/** A `YYYY-MM` month as a count of months, so spans are a subtraction. */
export function monthIndex(month: string) {
  const [year, m] = month.split('-').map(Number)
  return year! * 12 + m!
}

/** The `YYYY-MM` month a monthIndex stands for. */
export function monthAt(index: number) {
  const year = Math.floor((index - 1) / 12)
  return `${year}-${String(index - year * 12).padStart(2, '0')}`
}
