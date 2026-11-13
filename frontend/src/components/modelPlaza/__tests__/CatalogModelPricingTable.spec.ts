import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import CatalogModelPricingTable from '../CatalogModelPricingTable.vue'
import type { PlazaModel } from '@/api/modelPlaza'

function model(): PlazaModel {
  return {
    name: 'model-test', platform: 'openai',
    pricing: {
      billing_mode: 'token', input_price: 2e-6, output_price: 8e-6,
      cache_write_price: null, cache_read_price: null,
      image_input_price: null, image_output_price: null,
      per_request_price: null, intervals: []
    },
    official_pricing: {
      input_price: 4e-6, output_price: 16e-6,
      cache_write_price: null, cache_read_price: null
    }
  }
}

function render(m: PlazaModel, props = {}, locale = 'zh') {
  return mount(CatalogModelPricingTable, {
    props: { models: [m], rateMultiplier: 0.4, ...props },
    global: { plugins: [createI18n({ legacy: false, locale, messages: {}, missingWarn: false, fallbackWarn: false })] }
  })
}

describe('catalog pricing presentation', () => {
  it('shows the same paid prices and real official discount in the table and mobile card', () => {
    const wrapper = render(model(), { userRateMultiplier: 0.2 })
    for (const selector of ['tbody tr', '.mobile-price-card']) {
      const row = wrapper.get(selector)
      expect(row.text()).toContain('$0.40')
      expect(row.text()).toContain('$1.60')
      expect(row.get('.catalog-saving').text()).toContain('1 折')
      expect(row.get('.catalog-saving').text()).toContain('节省 90%')
    }
    wrapper.unmount()
  })

  it('applies each time period to both the paid price and its savings', () => {
    const m = model()
    m.time_pricing = { timezone: 'Asia/Shanghai', periods: [{ start_time: '00:00', end_time: '08:00', multiplier: 0.5 }] }
    const wrapper = render(m)
    const cards = wrapper.findAll('.mobile-price-card')
    expect(cards).toHaveLength(2)
    expect(cards[0].text()).toContain('2 折')
    expect(cards[1].text()).toContain('1 折')
    expect(cards[1].text()).toContain('$0.40')
    expect(cards[1].text()).toContain('00:00–08:00')
    wrapper.unmount()
  })

  it('uses independent image pricing without comparing a per-image price to per-token reference', () => {
    const m = model()
    m.pricing!.billing_mode = 'image'
    m.pricing!.per_request_price = 2
    const wrapper = render(m, { imageRateIndependent: true, imageRateMultiplier: 0.5 })
    expect(wrapper.get('.mobile-price-card').text()).toContain('$1.00')
    expect(wrapper.find('.catalog-saving').exists()).toBe(false)
    wrapper.unmount()
  })

  it('lets mobile users expand the full cache, tier and rate details', async () => {
    const wrapper = render(model())
    expect(wrapper.get('.mobile-detail-toggle').attributes('aria-expanded')).toBe('false')
    await wrapper.get('.mobile-detail-toggle').trigger('click')
    expect(wrapper.get('.mobile-detail-toggle').attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('.catalog-detail-table').classes()).toContain('catalog-table-expanded')
    wrapper.unmount()
  })

  it('uses percent-of-official wording for English', () => {
    const wrapper = render(model(), {}, 'en')
    expect(wrapper.get('.catalog-saving').text()).toContain('20% of official')
    expect(wrapper.get('.catalog-saving').text()).toContain('Save 80%')
    wrapper.unmount()
  })
})
