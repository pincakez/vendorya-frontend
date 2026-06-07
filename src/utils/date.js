import { format, formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useAuthStore } from '@/stores/auth'

// Re-export the new formatters so old import paths keep working.
export { formatNumber, formatCurrency, formatQty } from './format'


function resolveTz() {
  try {
    const auth = useAuthStore()
    return auth.timezone || 'Africa/Cairo'
  } catch {
    return 'Africa/Cairo'
  }
}


/**
 * Render a date in the active store's timezone.  Server clock is the source of truth;
 * the user just picks which IANA zone to render in (default Africa/Cairo).
 */
export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  // date-fns lacks tz support out-of-the-box; we delegate to the browser's
  // Intl with the user's tz, then run date-fns over the *adjusted* date.
  const tz = resolveTz()
  const adjusted = new Date(new Date(date).toLocaleString('en-US', { timeZone: tz }))
  return format(adjusted, fmt, { locale: enUS })
}

export const formatDateTime = (date) =>
  formatDate(date, 'dd MMM yyyy - hh:mm a')

export const formatRelative = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true, locale: enUS })
