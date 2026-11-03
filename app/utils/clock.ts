/** 19:50, or 1:02:10 past the hour. Whole seconds: a fraction is dropped. */
export function formatClock(seconds: number) {
  const s = Math.floor(seconds)
  const pad = (value: number) => String(value).padStart(2, '0')
  const [h, m] = [Math.floor(s / 3600), Math.floor((s % 3600) / 60)]
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`
}
