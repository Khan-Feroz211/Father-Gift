// Simple cn() without external dependency — uses string concatenation
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// Pakistani date format: dd MMM yyyy in Urdu-friendly locale
export function formatPKDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    return d.toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Karachi',
    })
  } catch {
    return String(dateStr)
  }
}

export function truncate(str: string, maxLength: number = 80): string {
  if (!str) return ''
  return str.length > maxLength ? str.slice(0, maxLength) + '…' : str
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}
