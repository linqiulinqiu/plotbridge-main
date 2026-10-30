// relative-time helpers replacing the old moment.js usage (fromNow/humanize)
// with the same intent, implemented on Intl.RelativeTimeFormat

const STEPS: [number, number, Intl.RelativeTimeFormatUnit][] = [
  [60, 1, 'second'],
  [3600, 60, 'minute'],
  [86400, 3600, 'hour'],
  [86400 * 30, 86400, 'day'],
  [86400 * 365, 86400 * 30, 'month'],
  [Number.POSITIVE_INFINITY, 86400 * 365, 'year'],
]

function stepFor(abs: number): [number, Intl.RelativeTimeFormatUnit] {
  for (const [limit, div, unit] of STEPS) {
    if (abs < limit) return [div, unit]
  }
  return [86400 * 365, 'year'] // unreachable
}

/** unix seconds -> "in 3 months" / "2 years ago" */
export function formatRelTS(ts: number | string | bigint): string {
  const diff = Number(ts) - Math.floor(Date.now() / 1000)
  const [div, unit] = stepFor(Math.abs(diff))
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(
    Math.round(diff / div),
    unit,
  )
}

/** duration seconds -> coarse text ("2 days", "about a month") */
export function formatDuration(secs: number | string | bigint): string {
  const n = Number(secs)
  const [div, unit] = stepFor(Math.abs(n))
  const text = new Intl.RelativeTimeFormat(undefined, { numeric: 'always' }).format(
    Math.round(n / div),
    unit,
  )
  return text.replace(/^in\s+/, '').replace(/\s+ago$/, '')
}

const SCALE: [number, string][] = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
]

/** compact number formatting replacing the `human-format` dependency */
export function humanFormat(val: number | string): string {
  const n = typeof val === 'string' ? parseFloat(val) : val
  if (Number.isNaN(n)) return ''
  for (const [size, suffix] of SCALE) {
    if (n >= size) {
      const v = n / size
      return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + suffix
    }
  }
  if (n > 0 && n < 1) return String(Math.round(n * 1e6) / 1e6)
  return String(n)
}
