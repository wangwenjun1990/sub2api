import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CatalogModelPricingTable from '../CatalogModelPricingTable.vue'
import type { PlazaModel } from '@/api/modelPlaza'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key })
}))

function model(name: string, mode: 'token' | 'image' = 'token'): PlazaModel {
  return {
    name,
    platform: 'openai',
    pricing: {
      billing_mode: mode,
      input_price: 1e-6,
      output_price: 2e-6,
      cache_write_price: null,
      cache_read_price: null,
      image_input_price: null,
      image_output_price: mode === 'image' ? 0.02 : null,
      per_request_price: mode === 'image' ? 0.02 : null,
      intervals: []
    },
    official_pricing: mode === 'token'
      ? { input_price: 1e-6, output_price: 2e-6, cache_write_price: null, cache_read_price: null }
      : null
  }
}

describe('CatalogModelPricingTable rate cells', () => {
  it('merges matching adjacent group rates while preserving a different independent rate', () => {
    const wrapper = mount(CatalogModelPricingTable, {
      props: {
        models: [model('model-a'), model('model-b'), model('image-model', 'image')],
        rateMultiplier: 1,
        imageRateIndependent: true,
        imageRateMultiplier: 0.5,
        mergeEqualRateRows: true
      }
    })

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(3)
    expect(rows[0].find('td[rowspan="2"]').exists()).toBe(true)
    expect(rows[1].find('td[rowspan]').exists()).toBe(false)
    expect(rows[2].find('td[rowspan="1"]').exists()).toBe(true)
    expect(rows[2].text()).toContain('0.5x')
    wrapper.unmount()
  })
})
