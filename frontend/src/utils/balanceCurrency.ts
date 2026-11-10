const usdFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const cnyFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatBalanceCurrency(
  usdAmount: number | null | undefined,
  usdToCnyRate: number | null | undefined,
): string {
  const amount = typeof usdAmount === 'number' && Number.isFinite(usdAmount) ? usdAmount : 0
  const usd = usdFormatter.format(amount)
  const rate = typeof usdToCnyRate === 'number' && Number.isFinite(usdToCnyRate)
    ? usdToCnyRate
    : 0

  if (rate <= 0 || !Number.isFinite(amount * rate)) {
    return `$${usd}`
  }

  return `¥${cnyFormatter.format(amount * rate)} (≈ $${usd})`
}
