import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import BalanceRechargeView from '../BalanceRechargeView.vue'
import type { CheckoutInfoResponse, MethodLimit } from '@/types/payment'
import { PAYMENT_RECOVERY_STORAGE_KEY } from '@/components/payment/paymentFlow'

const mocks = vi.hoisted(() => ({
  checkout: vi.fn(), createOrder: vi.fn(), showError: vi.fn(),
  replace: vi.fn(), push: vi.fn(),
  route: { path: '/recharge', query: {} as Record<string, string> }
}))
vi.mock('vue-router', async () => ({
  ...await vi.importActual('vue-router'),
  useRoute: () => mocks.route,
  useRouter: () => ({ replace: mocks.replace, push: mocks.push, resolve: () => ({ href: '/payment/stripe' }) })
}))
vi.mock('@/api/payment', () => ({ paymentAPI: { getCheckoutInfo: mocks.checkout } }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ user: { username: 'Alex', balance: 28.6 }, refreshUser: vi.fn() }) }))
vi.mock('@/stores/payment', () => ({ usePaymentStore: () => ({ createOrder: mocks.createOrder }) }))
vi.mock('@/stores/subscriptions', () => ({ useSubscriptionStore: () => ({ activeSubscriptions: [], fetchActiveSubscriptions: vi.fn().mockResolvedValue([]) }) }))
vi.mock('@/stores', () => ({ useAppStore: () => ({ cachedPublicSettings: { subscription_enabled: false }, showError: mocks.showError, showInfo: vi.fn(), showWarning: vi.fn() }) }))
vi.mock('@/utils/device', () => ({ isMobileDevice: () => false }))

function fixture(overrides: Partial<CheckoutInfoResponse> = {}): CheckoutInfoResponse {
  const limit: MethodLimit = { currency: 'CNY', available: true, single_min: 1, single_max: 0, daily_limit: 0, daily_used: 0, daily_remaining: 0, fee_rate: 0 }
  return { methods: { alipay: limit }, global_min: 1, global_max: 0, plans: [], balance_disabled: false, balance_recharge_multiplier: .14, recharge_fee_rate: 0, subscription_usd_to_cny_rate: 0, stripe_publishable_key: '', help_text: '', help_image_url: '', ...overrides }
}
const wrappers: ReturnType<typeof mount>[] = []
async function render(data = fixture()) {
  mocks.checkout.mockResolvedValueOnce({ data })
  const wrapper = mount(BalanceRechargeView, {
    global: {
      plugins: [createI18n({ legacy: false, locale: 'zh', messages: {}, missingWarn: false, fallbackWarn: false })],
      stubs: { AppLayout: { template: '<div><slot /></div>' }, RouterLink: { template: '<a><slot /></a>' }, PaymentStatusPanel: true, PaymentMethodSelector: true, SubscriptionPlanCard: true, Teleport: true }
    }
  })
  wrappers.push(wrapper)
  await flushPromises()
  return wrapper
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.checkout.mockReset()
  mocks.route.query = {}
  localStorage.clear()
  mocks.createOrder.mockRejectedValue({ message: 'Preview order refused' })
})
afterEach(() => { wrappers.splice(0).forEach(wrapper => wrapper.unmount()) })

describe('independent balance checkout', () => {
  it('offers modest presets and blocks custom values over 1000 without creating an order', async () => {
    const wrapper = await render()
    expect(wrapper.findAll('.amount-card')).toHaveLength(6)
    expect(wrapper.find('[data-testid="balance-amount-2000"]').exists()).toBe(false)
    await wrapper.get('#balance-custom-amount').setValue('1000.01')
    expect(wrapper.get('.re-pay-button').attributes('disabled')).toBeDefined()
    await wrapper.get('.re-pay-button').trigger('click')
    expect(mocks.createOrder).not.toHaveBeenCalled()
    await wrapper.get('#balance-custom-amount').setValue('1000')
    expect(wrapper.get('.re-pay-button').attributes('disabled')).toBeUndefined()
  })

  it('shows actual credited USD with a configured bonus and submits the original face amount', async () => {
    const wrapper = await render(fixture({ recharge_bonus_tiers: [{ min_amount: 50, bonus_percent: 10 }] }))
    expect(wrapper.get('.re-credit-hero').text()).toContain('7.70')
    expect(wrapper.get('[data-testid="recharge-bonus-row"]').text()).toContain('+$0.70')
    await wrapper.get('.re-pay-button').trigger('click')
    await flushPromises()
    expect(mocks.createOrder).toHaveBeenCalledWith(expect.objectContaining({ amount: 50, payment_type: 'alipay', order_type: 'balance' }))
  })

  it('uses discounted payment for channel limits while retaining face-value account credit and adding fees', async () => {
    const data = fixture({ recharge_bonus_mode: 'discount', recharge_bonus_tiers: [{ min_amount: 50, bonus_percent: 20 }], recharge_fee_rate: 2 })
    data.methods.alipay.single_max = 45
    const wrapper = await render(data)
    expect(wrapper.find('[data-testid="balance-amount-50"]').exists()).toBe(true)
    expect(wrapper.get('.re-credit-hero').text()).toContain('7.00')
    expect(wrapper.get('.re-total').text()).toContain('40.80')
    expect(wrapper.get('.re-pay-button').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-testid="recharge-discount-row"]').text()).toContain('10.00')
  })

  it('keeps payment disabled for an unavailable method', async () => {
    const data = fixture()
    data.methods.alipay.available = false
    const wrapper = await render(data)
    expect(wrapper.get('.re-pay-button').attributes('disabled')).toBeDefined()
    expect(mocks.createOrder).not.toHaveBeenCalled()
  })

  it('preserves a pending QR order across reloads without creating a second order', async () => {
    mocks.createOrder.mockResolvedValueOnce({ order_id: 123, amount: 7, pay_amount: 50, fee_rate: 0, expires_at: new Date(Date.now() + 600_000).toISOString(), qr_code: 'https://example.com/preview-qr', payment_type: 'alipay' })
    const wrapper = await render()
    await wrapper.get('.re-pay-button').trigger('click')
    await flushPromises()
    expect(wrapper.findComponent({ name: 'PaymentStatusPanel' }).exists()).toBe(true)
    expect(JSON.parse(localStorage.getItem(PAYMENT_RECOVERY_STORAGE_KEY)!)).toMatchObject({ orderId: 123, payAmount: 50 })
    wrapper.unmount()
    mocks.createOrder.mockClear()
    const restored = await render()
    expect(restored.findComponent({ name: 'PaymentStatusPanel' }).exists()).toBe(true)
    expect(restored.find('.re-pay-button').exists()).toBe(false)
    expect(mocks.createOrder).not.toHaveBeenCalled()
  })

  it('also blocks an oversized amount passed through the WeChat callback query', async () => {
    mocks.route.query = { wechat_resume: '1', amount: '1001', openid: 'preview-openid', payment_type: 'alipay' }
    const wrapper = await render()
    expect(mocks.createOrder).not.toHaveBeenCalled()
    expect(wrapper.get('.re-pay-button').attributes('disabled')).toBeDefined()
  })

  it('shows an unavailable state when balance payments are disabled', async () => {
    const wrapper = await render(fixture({ balance_disabled: true }))
    expect(wrapper.find('.re-pay-button').exists()).toBe(false)
    expect(wrapper.text()).toContain('payment.billingUnavailable')
  })

  it('shows a retry state after checkout fails rather than an empty form', async () => {
    mocks.checkout.mockRejectedValueOnce({ message: 'Temporarily unavailable' })
    const wrapper = await render()
    expect(wrapper.find('.re-load-error').exists()).toBe(true)
    expect(wrapper.find('.re-pay-button').exists()).toBe(false)
    await wrapper.get('.re-load-error button').trigger('click')
    await flushPromises()
    expect(wrapper.find('.re-load-error').exists()).toBe(false)
    expect(wrapper.find('.re-pay-button').exists()).toBe(true)
  })
})
