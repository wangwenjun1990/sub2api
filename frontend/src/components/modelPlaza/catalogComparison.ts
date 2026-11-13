import type { PlazaModel } from '@/api/modelPlaza'
import { resolveIntervalPrices } from '@/utils/pricing'
export interface CatalogComparison { min: number; max: number }
/** Compare input/output in the same currency, unit and context tier, without assuming usage weights. */
export function compareCatalogModel(model: PlazaModel, rate: number): CatalogComparison | null {
  if (!model.pricing || !model.official_pricing ||
      (model.pricing.billing_mode && model.pricing.billing_mode !== 'token') ||
      model.long_context_basis === 'marginal' || !Number.isFinite(rate) || rate < 0) return null
  const paidTiers = model.pricing.intervals ?? []
  const officialTiers = model.official_pricing.intervals ?? []
  if (officialTiers.length && (!paidTiers.length || officialTiers.length !== paidTiers.length)) return null
  const pairs = paidTiers.length ? paidTiers.map(tier => {
    const official = officialTiers.length
      ? officialTiers.find(other => other.min_tokens === tier.min_tokens && other.max_tokens === tier.max_tokens)
      : model.official_pricing
    return official ? { paid: resolveIntervalPrices(tier, model.pricing!), official } : null
  }) : [{ paid: model.pricing, official: model.official_pricing }]
  if (pairs.some(pair => !pair)) return null
  const ratios: number[] = []
  for (const pair of pairs) {
    if (!pair) continue
    for (const field of ['input_price', 'output_price'] as const) {
      const paid = pair.paid[field], official = pair.official[field]
      if (paid == null || official == null || !Number.isFinite(paid) || !Number.isFinite(official) || paid < 0 || official <= 0) return null
      const ratio = paid * rate / official
      if (!Number.isFinite(ratio)) return null
      ratios.push(ratio)
    }
  }
  return ratios.length ? { min: Math.min(...ratios), max: Math.max(...ratios) } : null
}
export function compareCatalogGroup(models: PlazaModel[], rate: number): CatalogComparison | null {
  const items = models.map(model => compareCatalogModel(model, rate)).filter((item): item is CatalogComparison => item !== null)
  return items.length ? { min: Math.min(...items.map(item => item.min)), max: Math.max(...items.map(item => item.max)) } : null
}
