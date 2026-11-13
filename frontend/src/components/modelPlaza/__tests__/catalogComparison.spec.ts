
import { describe, expect, it } from 'vitest'
import { compareCatalogModel, compareCatalogGroup } from '../catalogComparison'
import type { PlazaModel } from '@/api/modelPlaza'
function model(): PlazaModel {
  return { name: 'test', platform: 'openai',
    pricing: { billing_mode: 'token', input_price: 2e-6, output_price: 8e-6,
      cache_write_price: null, cache_read_price: null, image_input_price: null, image_output_price: null, per_request_price: null, intervals: [] },
    official_pricing: { input_price: 4e-6, output_price: 16e-6, cache_write_price: null, cache_read_price: null } }
}
describe('catalog price comparison', () => {
  it('compares paid prices rather than treating the group rate as the official discount', () => {
    expect(compareCatalogModel(model(), 0.4)).toEqual({ min: 0.2, max: 0.2 })
  })
  it('preserves different input and output discounts', () => {
    const m = model(); m.pricing!.output_price = 16e-6
    expect(compareCatalogModel(m, 0.5)).toEqual({ min: 0.25, max: 0.5 })
  })
  it('allows free prices and reports premiums without clamping', () => {
    expect(compareCatalogModel(model(), 0)).toEqual({ min: 0, max: 0 })
    expect(compareCatalogModel(model(), 3)).toEqual({ min: 1.5, max: 1.5 })
  })
  it('does not compare per-request media prices with official per-token prices', () => {
    const m = model(); m.pricing!.billing_mode = 'image'
    expect(compareCatalogModel(m, 0.2)).toBeNull()
  })
  it('rejects absent, zero, nonfinite or incomplete official reference prices', () => {
    for (const reference of [null, 0, Infinity, NaN]) {
      const m = model(); m.official_pricing!.input_price = reference
      expect(compareCatalogModel(m, 0.2)).toBeNull()
    }
    expect(compareCatalogModel(model(), -1)).toBeNull()
  })
  it('resolves channel tier multipliers and matches official context boundaries', () => {
    const m = model()
    const tier = { min_tokens: 0, max_tokens: 200000, input_price: null, output_price: null, input_multiplier: 2, output_multiplier: 2, cache_write_price: null, cache_read_price: null, per_request_price: null }
    m.pricing!.intervals = [tier]
    m.official_pricing!.intervals = [{ ...tier, input_price: 8e-6, output_price: 32e-6 }]
    expect(compareCatalogModel(m, 0.4)).toEqual({ min: 0.2, max: 0.2 })
    m.official_pricing!.intervals[0].max_tokens = 100000
    expect(compareCatalogModel(m, 0.4)).toBeNull()
  })
  it('omits comparisons when disabled paid tiers or marginal billing cannot match official tiers', () => {
    const m = model(); m.long_context_basis = 'marginal'
    expect(compareCatalogModel(m, 0.4)).toBeNull()
    m.long_context_basis = 'whole_request'
    m.official_pricing!.intervals = [{ min_tokens: 0, max_tokens: null, input_price: 4e-6, output_price: 16e-6, cache_write_price: null, cache_read_price: null, per_request_price: null }]
    expect(compareCatalogModel(m, 0.4)).toBeNull()
  })
  it('summarizes comparable models only and spans their real discounts', () => {
    const expensive = model(); expensive.pricing!.input_price = 4e-6
    const unknown = model(); unknown.official_pricing = null
    expect(compareCatalogGroup([model(), expensive, unknown], 0.4)).toEqual({ min: 0.2, max: 0.4 })
    expect(compareCatalogGroup([unknown], 0.4)).toBeNull()
  })
})
