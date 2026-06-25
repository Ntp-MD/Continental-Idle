// Number formatting per spec: K, M, B, T, aa, ab...

const ALPHA_BASE = 'abcdefghijklmnopqrstuvwxyz'
const SUFFIXES = ['', 'K', 'M', 'B', 'T']

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return n > 0 ? '∞' : '0'
  if (n < 0) {
    const result = formatNumber(-n)
    return result === '0' ? '0' : '-' + result
  }
  if (n < 1000) return Math.floor(n).toString()

  // Standard suffixes K, M, B, T (up to but not including 10^15)
  for (let i = 4; i >= 1; i--) {
    const threshold = Math.pow(10, i * 3)
    const nextThreshold = Math.pow(10, (i + 1) * 3)
    if (n >= threshold && n < nextThreshold) {
      const val = n / threshold
      return val < 10 ? val.toFixed(2) + SUFFIXES[i]
        : val < 100 ? val.toFixed(1) + SUFFIXES[i]
        : Math.floor(val) + SUFFIXES[i]
    }
  }

  // Extended notation: aa, ab, ac... (10^15 and above)
  const exp = Math.floor(Math.log10(n))
  if (exp >= 15) {
    const tier = Math.floor((exp - 15) / 3)
    const first = Math.floor(tier / 26)
    const second = tier % 26

    if (first >= 26) {
      return n.toExponential(2)
    }

    const suffix = ALPHA_BASE[first] + ALPHA_BASE[second]
    const divisor = Math.pow(10, 15 + tier * 3)
    const val = n / divisor
    return val.toFixed(2) + suffix
  }

  return Math.floor(n).toString()
}

export function formatIncome(n: number): string {
  return formatNumber(n) + '/s'
}

export function formatCost(n: number): string {
  return formatNumber(n)
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}
