import { format, formatDistanceToNow } from 'date-fns'
import { arEG } from 'date-fns/locale'

export const formatDate = (date, fmt = 'dd MMM yyyy') =>
  format(new Date(date), fmt, { locale: arEG })

export const formatDateTime = (date) =>
  format(new Date(date), 'dd MMM yyyy - hh:mm a', { locale: arEG })

export const formatRelative = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true, locale: arEG })

export const formatCurrency = (amount, symbol = 'EGP') =>
  `${Number(amount).toFixed(2)} ${symbol}`
