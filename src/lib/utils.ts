export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function calcProfit(cost: number, soldPrice: number | null, fee = 0.13): number {
  if (!soldPrice) return 0
  return soldPrice * (1 - fee) - cost
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}