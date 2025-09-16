export type FormatDateOptions = { withTime?: boolean; locale?: string };

export function useDateFormatter(timezoneLabel?: string) {
  // Use saved timezone or fallback
  const saved = typeof window !== 'undefined' ? localStorage.getItem('pref_timezone') || '' : ''
  const tzLabel = timezoneLabel || saved || 'UTC'

  const format = (iso?: string | Date | null, opts?: FormatDateOptions) => {
    if (!iso) return '-'
    const date = typeof iso === 'string' ? new Date(iso) : iso
    try {
      const locale = opts?.locale || 'en-US'
      const withTime = opts?.withTime ?? true
      const base: Intl.DateTimeFormatOptions = { timeZone: tzLabel }
      const dayFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', ...base }).format(date)
      // Add ordinal suffix
      const dayNum = Number(dayFmt)
      const suffix = (n: number) => {
        const j = n % 10, k = n % 100
        if (j === 1 && k !== 11) return 'st'
        if (j === 2 && k !== 12) return 'nd'
        if (j === 3 && k !== 13) return 'rd'
        return 'th'
      }
      const month = new Intl.DateTimeFormat(locale, { month: 'long', ...base }).format(date)
      const year = new Intl.DateTimeFormat(locale, { year: 'numeric', ...base }).format(date)
      if (!withTime) return `${dayNum}${suffix(dayNum)} ${month}, ${year}`
      const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false, ...base }).format(date)
      return `${dayNum}${suffix(dayNum)} ${month}, ${year} ${time}`
    } catch {
      return typeof iso === 'string' ? iso : date.toISOString()
    }
  }

  return { format, timezone: tzLabel }
} 