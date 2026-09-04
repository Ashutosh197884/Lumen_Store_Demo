import { CURRENCY } from './settings'

export const money = (n) =>
  `${CURRENCY.symbol}${Number(n || 0).toFixed(2)}`

export const uid = (prefix) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

export const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const timeAgo = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
