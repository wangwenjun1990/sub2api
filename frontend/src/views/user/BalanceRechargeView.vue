<template>
  <AppLayout>
    <div class="balance-recharge mx-auto space-y-6">

      <header class="re-hero">
        <div class="re-hero-copy"><span class="re-eyebrow"><i></i> ACCOUNT / BALANCE</span><h1>{{ zh ? '为下一个好点子' : 'A little credit.' }}<br /><em>{{ zh ? '充点能量。' : 'A lot of possibility.' }}</em></h1><p>{{ zh ? '小额充值，随心调用。让每一份预算，都用在创造上。' : 'Top up as you go. Put your budget into building something great.' }}</p><div class="re-hero-tags"><span>{{ zh ? '按量消费' : 'Pay as you go' }}</span><span>{{ zh ? '到账明细清晰' : 'Transparent credit' }}</span><span>{{ zh ? '单次最高 1,000' : 'Up to 1,000 per top-up' }}</span></div></div>
        <div class="re-balance-card"><div class="re-balance-top"><span>{{ t('payment.currentBalance') }}</span><Icon name="creditCard" size="md" /></div><strong><small>$</small>{{ (user?.balance ?? 0).toFixed(2) }}<small>USD</small></strong><div class="re-balance-bottom"><span>{{ user?.username || user?.email || '—' }}</span><RouterLink to="/orders">{{ zh ? '查看记录' : 'View orders' }} <span aria-hidden="true">↗</span></RouterLink></div><div class="re-card-orbit" aria-hidden="true"></div></div>
      </header>
      <div v-if="errorMessage" class="re-inline-error" role="alert">{{ errorMessage }}<p v-if="errorHintMessage">{{ errorHintMessage }}</p></div>
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
      <template v-else>
        <!-- Tab Switcher (hide during payment and subscription confirm) -->
        <div v-if="tabs.length > 1 && paymentPhase === 'select' && !selectedPlan" class="re-tabs">
          <button v-for="tab in tabs" :key="tab.key"
            type="button" :aria-pressed="activeTab === tab.key" :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key">{{ tab.label }}</button>
        </div>
        <!-- Payment in progress (shared by recharge and subscription) -->
        <template v-if="paymentPhase === 'paying'">
          <PaymentStatusPanel
            :order-id="paymentState.orderId"
            :amount="paymentState.amount"
            :pay-amount="paymentState.payAmount"
            :qr-code="paymentState.qrCode"
            :expires-at="paymentState.expiresAt"
            :payment-type="paymentState.paymentType"
            :pay-url="paymentState.payUrl"
            :order-type="paymentState.orderType"
            :currency="paymentState.currency || selectedCurrency"
            :out-trade-no="paymentState.outTradeNo"
            :mobile-alipay-deep-link="paymentState.alipayMobilePrecreateDeepLink"
            @done="onPaymentDone"
            @success="onPaymentSuccess"
            @settled="onPaymentSettled"
          />
        </template>
        <!-- Tab content (select phase) -->
        <template v-else>
          <!-- Neither top-up nor subscriptions available (balance recharge disabled via API while subscriptions are off) -->
          <div v-if="tabs.length === 0" class="card py-16 text-center">
            <p class="text-gray-500 dark:text-gray-400">{{ t('payment.billingUnavailable') }}</p>
          </div>
          <template v-else-if="activeTab === 'recharge'">
            <div v-if="enabledMethods.length === 0" class="re-panel re-empty">{{ t('payment.notAvailable') }}</div>
            <div v-else class="re-checkout-grid">
              <div class="re-form">
                <section class="re-panel re-amount-panel">
                  <div class="re-section-heading"><div><span class="re-eyebrow">01 / AMOUNT</span><h2>{{ zh ? '选择充值金额' : 'Choose your amount' }}</h2></div><span class="re-currency-tag">{{ selectedCurrency }}</span></div>
                  <p class="re-section-description">{{ zh ? '按需充值，从小额开始。每一笔到账都清清楚楚。' : 'Start small and top up as needed. See exactly what you receive.' }}</p>
                  <div v-if="renderedBonusNotice" class="re-notice markdown-body" data-testid="recharge-bonus-notice" v-html="renderedBonusNotice"></div>
                  <BalanceAmountPicker v-model="amount" :amounts="[10, 20, 50, 100, 500, 1000].filter(value => (globalMinAmount <= 0 || value >= globalMinAmount) && (globalMaxAmount <= 0 || value <= globalMaxAmount))" :max="1000" :bonus-tiers="rechargeBonusTiers" :bonus-mode="rechargeBonusMode" :multiplier="balanceRechargeMultiplier" :currency="selectedCurrency" :error="validAmount > 1000 ? (zh ? '单次充值最高 1000' : 'Maximum top-up: 1,000') : amountError" />
                </section>
                <section class="re-panel re-method-panel">
                  <div class="re-section-heading"><div><span class="re-eyebrow">02 / PAYMENT</span><h2>{{ zh ? '选择支付方式' : 'Choose a payment method' }}</h2></div></div>
                  <p class="re-section-description">{{ zh ? '仅展示当前站点已接入的支付方式。' : 'Payment methods available on this site.' }}</p>
                  <PaymentMethodSelector :methods="methodOptions" :selected="selectedMethod" @select="selectedMethod = $event" />
                </section>
                <div class="re-quiet-note"><Icon name="infoCircle" size="sm" /><p>{{ zh ? '账户余额用于 API 按量消费，实际模型价格可在模型广场查看。' : 'Account credit pays for API usage. Explore the model catalog for prices.' }} <RouterLink to="/model-plaza/catalog">{{ zh ? '查看模型价格 →' : 'View model prices →' }}</RouterLink></p></div>
              </div>
              <aside class="re-summary re-panel" :aria-label="zh ? '充值明细' : 'Top-up summary'">
                <div class="re-section-heading"><div><span class="re-eyebrow">YOUR TOP-UP</span><h2>{{ zh ? '本次充值' : 'Your top-up' }}</h2></div><Icon name="creditCard" size="md" /></div>
                <div class="re-credit-hero"><span>{{ t('payment.creditedBalance') }} <small>USD</small></span><strong><small>$</small>{{ creditedAmount.toFixed(2) }}</strong><span v-if="bonusQuote.percent > 0" class="re-benefit-tag">{{ bonusQuote.mode === 'discount' ? (zh ? '本单立省 ' : 'Save ') : (zh ? '额外加赠 ' : 'Bonus ') }}{{ formatRechargeBonusNumber(bonusQuote.percent) }}%</span><p>{{ zh ? '支付成功后计入账户余额' : 'Credited to your account after successful payment' }}</p></div>
                <dl class="re-breakdown">
                  <div><dt>{{ zh ? '充值面额' : 'Top-up amount' }}</dt><dd>{{ formatSelectedPaymentAmount(validAmount) }}</dd></div>
                  <div v-if="discountAmount > 0" class="re-benefit-row" data-testid="recharge-discount-row"><dt>{{ t('payment.rechargeBonus.discountLabelWithPercent', { percent: formatRechargeBonusNumber(bonusQuote.percent) }) }}</dt><dd>−{{ formatSelectedPaymentAmount(discountAmount) }}</dd></div>
                  <div v-if="feeRate > 0"><dt>{{ t('payment.fee') }} <small>{{ feeRate }}%</small></dt><dd>+{{ formatSelectedPaymentAmount(feeAmount) }}</dd></div>
                  <div v-if="showBonusRow" class="re-benefit-row" data-testid="recharge-bonus-row"><dt>{{ t('payment.rechargeBonus.amountLabelWithPercent', { percent: formatRechargeBonusNumber(bonusQuote.percent) }) }}</dt><dd>+${{ bonusQuote.bonus.toFixed(2) }}</dd></div>
                  <div><dt>{{ zh ? '到账倍率' : 'Credit rate' }}</dt><dd>1 {{ selectedCurrency }} = {{ formatRechargeBonusNumber(balanceRechargeMultiplier) }} USD</dd></div>
                </dl>
                <div class="re-total"><span>{{ t('payment.actualPay') }} <small>{{ selectedCurrency }}</small></span><strong>{{ formatSelectedPaymentAmount(totalAmount) }}</strong></div>
                <button type="button" class="re-pay-button" :disabled="!canSubmit || validAmount > 1000 || submitting" @click="handleSubmitRecharge"><span v-if="submitting" class="re-spinner"></span>{{ submitting ? t('common.processing') : (zh ? '确认充值' : 'Confirm top-up') }}<span v-if="!submitting" aria-hidden="true">→</span></button>
                <p class="re-payment-note">{{ zh ? '请核对充值账户与金额后继续支付' : 'Check your account and amount before paying' }}</p>
                <div class="re-account"><span class="re-avatar" aria-hidden="true">{{ (user?.username || 'U').slice(0,1).toUpperCase() }}</span><div><span>{{ t('payment.rechargeAccount') }}</span><strong>{{ user?.username || user?.email || '—' }}</strong></div><RouterLink to="/orders">{{ zh ? '充值记录' : 'Orders' }} ↗</RouterLink></div>
              </aside>
            </div>
          </template>

          <!-- Subscribe Tab -->
          <template v-else-if="activeTab === 'subscription'">
            <!-- Subscription confirm (inline, replaces plan list) -->
            <template v-if="selectedPlan">
              <div class="card p-5">
                <!-- Header: platform badge + plan name -->
                <div class="mb-3 flex flex-wrap items-center gap-2">
                  <span :class="['rounded-md border px-2 py-0.5 text-xs font-medium', planBadgeClass]">
                    {{ platformLabel(selectedPlan.group_platform || '') }}
                  </span>
                  <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ selectedPlan.name }}</h3>
                </div>
                <!-- Price -->
                <div class="flex items-baseline gap-2">
                  <span v-if="selectedPlan.original_price" class="text-sm text-gray-400 line-through dark:text-gray-500">
                    {{ formatSelectedSubscriptionPaymentAmount(selectedPlan.original_price) }}
                  </span>
                  <span :class="['text-3xl font-bold', planTextClass]">{{ formatSelectedSubscriptionPaymentAmount(selectedPlan.price) }}</span>
                  <span class="text-sm text-gray-500 dark:text-gray-400">/ {{ planValiditySuffix }}</span>
                </div>
                <!-- Description -->
                <p v-if="selectedPlan.description" class="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {{ selectedPlan.description }}
                </p>
                <!-- Rate + Limits grid -->
                <div class="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ t('payment.planCard.rate') }}</span>
                    <div class="flex items-baseline">
                      <span :class="['text-lg font-bold', planTextClass]">×{{ selectedPlan.rate_multiplier ?? 1 }}</span>
                    </div>
                  </div>
                  <div v-if="planHasPeakRate(selectedPlan)">
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ t('payment.planCard.peakRate') }}</span>
                    <div class="text-sm font-semibold text-amber-700 dark:text-amber-300">
                      {{ planPeakRateLabel(selectedPlan) }}
                    </div>
                  </div>
                  <div v-if="selectedPlan.daily_limit_usd != null">
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ t('payment.planCard.dailyLimit') }}</span>
                    <div class="text-lg font-semibold text-gray-800 dark:text-gray-200">${{ selectedPlan.daily_limit_usd }}</div>
                  </div>
                  <div v-if="selectedPlan.weekly_limit_usd != null">
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ t('payment.planCard.weeklyLimit') }}</span>
                    <div class="text-lg font-semibold text-gray-800 dark:text-gray-200">${{ selectedPlan.weekly_limit_usd }}</div>
                  </div>
                  <div v-if="selectedPlan.monthly_limit_usd != null">
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ t('payment.planCard.monthlyLimit') }}</span>
                    <div class="text-lg font-semibold text-gray-800 dark:text-gray-200">${{ selectedPlan.monthly_limit_usd }}</div>
                  </div>
                  <div v-if="selectedPlan.daily_limit_usd == null && selectedPlan.weekly_limit_usd == null && selectedPlan.monthly_limit_usd == null">
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ t('payment.planCard.quota') }}</span>
                    <div class="text-lg font-semibold text-gray-800 dark:text-gray-200">{{ t('payment.planCard.unlimited') }}</div>
                  </div>
                </div>
              </div>
              <div v-if="enabledMethods.length >= 1" class="card p-6">
                <PaymentMethodSelector
                  :methods="subMethodOptions"
                  :selected="selectedMethod"
                  @select="selectedMethod = $event"
                />
              </div>
              <div v-if="feeRate > 0 && selectedPlan.price > 0" class="card p-6">
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400">{{ t('payment.amountLabel') }}</span>
                    <span class="text-gray-900 dark:text-white">{{ formatSelectedPaymentAmount(subPaymentAmount) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400">{{ t('payment.fee') }} ({{ feeRate }}%)</span>
                    <span class="text-gray-900 dark:text-white">{{ formatSelectedPaymentAmount(subFeeAmount) }}</span>
                  </div>
                  <div class="flex justify-between border-t border-gray-200 pt-2 dark:border-dark-600">
                    <span class="font-medium text-gray-700 dark:text-gray-300">{{ t('payment.actualPay') }}</span>
                    <span class="text-lg font-bold text-primary-600 dark:text-primary-400">{{ formatSelectedPaymentAmount(subTotalAmount) }}</span>
                  </div>
                </div>
              </div>
              <button :class="['btn w-full py-3 text-base font-medium', paymentButtonClass]" :disabled="!canSubmitSubscription || submitting" @click="confirmSubscribe">
                <span v-if="submitting" class="flex items-center justify-center gap-2">
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  {{ t('common.processing') }}
                </span>
                <span v-else>{{ t('payment.createOrder') }} {{ formatSelectedPaymentAmount(subTotalAmount) }}</span>
              </button>
              <button class="btn btn-secondary w-full" @click="selectedPlan = null">{{ t('common.cancel') }}</button>
            </template>
            <!-- Plan list -->
            <template v-else>
              <div v-if="checkout.plans.length === 0" class="card py-16 text-center">
                <Icon name="gift" size="xl" class="mx-auto mb-3 text-gray-300 dark:text-dark-600" />
                <p class="text-gray-500 dark:text-gray-400">{{ t('payment.noPlans') }}</p>
              </div>
              <div v-else :class="planGridClass">
                <SubscriptionPlanCard v-for="plan in checkout.plans" :key="plan.id" :plan="plan" :active-subscriptions="activeSubscriptions" @select="selectPlan" />
              </div>
              <!-- Active subscriptions (compact, below plan list) -->
              <div v-if="activeSubscriptions.length > 0">
                <p class="mb-2 text-xs font-medium text-gray-400 dark:text-gray-500">{{ t('payment.activeSubscription') }}</p>
                <div class="space-y-2">
                  <div v-for="sub in activeSubscriptions" :key="sub.id"
                    class="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 dark:border-dark-700 dark:bg-dark-800">
                    <div :class="['h-6 w-1 shrink-0 rounded-full', platformAccentBarClass(sub.group?.platform || '')]" />
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5">
                        <span class="truncate text-xs font-semibold text-gray-900 dark:text-white">{{ sub.group?.name || t('payment.groupFallback', { id: sub.group_id }) }}</span>
                        <span :class="['shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium', platformBadgeLightClass(sub.group?.platform || '')]">{{ platformLabel(sub.group?.platform || '') }}</span>
                      </div>
                      <div class="flex flex-wrap gap-x-3 text-[11px] text-gray-400 dark:text-gray-500">
                        <span>{{ t('payment.planCard.rate') }}: ×{{ sub.group?.rate_multiplier ?? 1 }}</span>
                        <span v-if="subscriptionHasPeakRate(sub)">{{ t('payment.planCard.peakRate') }}: {{ subscriptionPeakRateLabel(sub) }}</span>
                        <span v-if="sub.group?.daily_limit_usd == null && sub.group?.weekly_limit_usd == null && sub.group?.monthly_limit_usd == null">{{ t('payment.planCard.quota') }}: {{ t('payment.planCard.unlimited') }}</span>
                        <span v-if="sub.expires_at">{{ t('userSubscriptions.daysRemaining', { days: getDaysRemaining(sub.expires_at) }) }}</span>
                        <span v-else>{{ t('userSubscriptions.noExpiration') }}</span>
                      </div>
                    </div>
                    <span class="badge badge-success shrink-0 text-[10px]">{{ t('userSubscriptions.status.active') }}</span>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </template>
        <div v-if="(checkout.help_text || checkout.help_image_url) && paymentPhase === 'select' && !selectedPlan" class="card p-4">
          <div class="flex flex-col items-center gap-3">
            <img v-if="checkout.help_image_url" :src="checkout.help_image_url" alt=""
              class="h-40 max-w-full cursor-pointer rounded-lg object-contain transition-opacity hover:opacity-80"
              @click="previewImage = checkout.help_image_url" />
            <div v-if="checkout.help_text" class="markdown-body w-full overflow-x-auto break-words" v-html="renderedHelpText"></div>
          </div>
        </div>
      </template>
    </div>
    <!-- Renewal Plan Selection Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showRenewalModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="closeRenewalModal">
          <div class="relative flex max-h-full w-full max-w-lg flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-dark-700 dark:bg-dark-900">
            <!-- Close button -->
            <button class="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-dark-700 dark:hover:text-gray-200" @click="closeRenewalModal">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 class="mb-4 shrink-0 text-lg font-semibold text-gray-900 dark:text-white">{{ t('payment.selectPlan') }}</h3>
            <div class="min-h-0 space-y-4 overflow-y-auto">
              <SubscriptionPlanCard v-for="plan in renewalPlans" :key="plan.id" :plan="plan" :active-subscriptions="activeSubscriptions" @select="selectPlanFromModal" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <!-- Image Preview Overlay -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="previewImage" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" @click="previewImage = ''">
          <img :src="previewImage" alt="" class="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl" />
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import '@/styles/announcement-markdown.css'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePaymentStore } from '@/stores/payment'
import { useSubscriptionStore } from '@/stores/subscriptions'
import { useAppStore } from '@/stores'
import { FeatureFlags, resolveFeatureFlag } from '@/utils/featureFlags'
import { paymentAPI } from '@/api/payment'
import { extractApiErrorMessage, extractI18nErrorMessage } from '@/utils/apiError'
import { isMobileDevice } from '@/utils/device'
import { hasPeakRate, formatPeakRateWindow, serverTimezoneLabel, type PeakRateFields } from '@/utils/peak-rate'
import type { SubscriptionPlan, CheckoutInfoResponse, CreateOrderResult, OrderType } from '@/types/payment'
import { formatRechargeBonusNumber, normalizeRechargeBonusMode, normalizeRechargeBonusTiers, quoteRechargeBonus } from '@/utils/rechargeBonus'
import AppLayout from '@/components/layout/AppLayout.vue'
import BalanceAmountPicker from '@/components/payment/BalanceAmountPicker.vue'
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector.vue'
import { METHOD_ORDER, getPaymentPopupFeatures, isBuiltInAlipayMethod, isBuiltInWxpayMethod } from '@/components/payment/providerConfig'
import {
  PAYMENT_RECOVERY_STORAGE_KEY,
  buildCreateOrderPayload,
  clearPaymentRecoverySnapshot,
  decidePaymentLaunch,
  getVisibleMethods,
  normalizeVisibleMethod,
  readPaymentRecoverySnapshot,
  type PaymentRecoverySnapshot,
  writePaymentRecoverySnapshot,
} from '@/components/payment/paymentFlow'
import { platformAccentBarClass, platformBadgeLightClass, platformBadgeClass, platformTextClass, platformLabel } from '@/utils/platformColors'
import SubscriptionPlanCard from '@/components/payment/SubscriptionPlanCard.vue'
import PaymentStatusPanel from '@/components/payment/PaymentStatusPanel.vue'
import Icon from '@/components/icons/Icon.vue'
import { DEFAULT_PAYMENT_CURRENCY, formatPaymentAmount, normalizePaymentCurrency } from '@/components/payment/currency'
import { planValiditySuffix as validitySuffixOf } from '@/components/payment/validity'
import type { PaymentMethodOption } from '@/components/payment/PaymentMethodSelector.vue'
import { buildPaymentErrorToastMessage, describePaymentScenarioError } from './paymentUx'
import { hasWechatResumeQuery, parseWechatResumeRoute, stripWechatResumeQuery } from './paymentWechatResume'

const i18n = useI18n()
const { t } = i18n
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const paymentStore = usePaymentStore()
const subscriptionStore = useSubscriptionStore()
const appStore = useAppStore()

const user = computed(() => authStore.user)
const recoveryUserId = authStore.user?.id
const activeSubscriptions = computed(() => subscriptionStore.activeSubscriptions)

function getDaysRemaining(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function subscriptionHasPeakRate(sub: { group?: PeakRateFields | null }): boolean {
  return hasPeakRate(sub.group)
}

function subscriptionPeakRateLabel(sub: { group?: PeakRateFields | null }): string {
  return formatPeakRateWindow(sub.group, serverTimezoneLabel(appStore.cachedPublicSettings?.server_utc_offset))
}

const loading = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const errorHintMessage = ref('')
const activeTab = ref<'recharge' | 'subscription'>('recharge')
const amount = ref<number | null>(50)
const zh = computed(() => (localeCode.value ?? 'zh').startsWith('zh'))
const selectedMethod = ref('')
const selectedPlan = ref<SubscriptionPlan | null>(null)
const previewImage = ref('')

const paymentPhase = ref<'select' | 'paying'>('select')

interface CreateOrderOptions {
  openid?: string
  wechatResumeToken?: string
  paymentType?: string
  isResume?: boolean
  mobileQrFallbackAttempted?: boolean
}

interface WeixinJSBridgeLike {
  invoke(
    action: string,
    payload: Record<string, unknown>,
    callback: (result: Record<string, unknown>) => void,
  ): void
}

function emptyPaymentState(): PaymentRecoverySnapshot {
  return {
    orderId: 0,
    amount: 0,
    qrCode: '',
    expiresAt: '',
    paymentType: '',
    payUrl: '',
    outTradeNo: '',
    clientSecret: '',
    intentId: '',
    currency: '',
    countryCode: '',
    paymentEnv: '',
    payAmount: 0,
    orderType: '',
    paymentMode: '',
    resumeToken: '',
    alipayMobilePrecreateDeepLink: false,
    createdAt: 0,
  }
}

function getWeixinJSBridge(): WeixinJSBridgeLike | undefined {
  return (window as Window & { WeixinJSBridge?: WeixinJSBridgeLike }).WeixinJSBridge
}

function waitForWeixinJSBridge(timeoutMs = 4000): Promise<WeixinJSBridgeLike | null> {
  const existing = getWeixinJSBridge()
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve) => {
    let settled = false
    const finish = (bridge: WeixinJSBridgeLike | null) => {
      if (settled) return
      settled = true
      document.removeEventListener('WeixinJSBridgeReady', handleReady)
      document.removeEventListener('onWeixinJSBridgeReady', handleReady)
      window.clearTimeout(timer)
      resolve(bridge)
    }
    const handleReady = () => finish(getWeixinJSBridge() ?? null)
    const timer = window.setTimeout(() => finish(getWeixinJSBridge() ?? null), timeoutMs)
    document.addEventListener('WeixinJSBridgeReady', handleReady, false)
    document.addEventListener('onWeixinJSBridgeReady', handleReady, false)
  })
}

async function invokeWechatJsapiPayment(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const bridge = await waitForWeixinJSBridge()
  if (!bridge) {
    throw new Error('WECHAT_JSAPI_UNAVAILABLE')
  }
  return new Promise((resolve) => {
    bridge.invoke('getBrandWCPayRequest', payload, (result) => resolve(result || {}))
  })
}

const paymentState = ref<PaymentRecoverySnapshot>(emptyPaymentState())

function persistRecoverySnapshot(snapshot: PaymentRecoverySnapshot) {
  if (typeof window === 'undefined' || !snapshot.orderId) return
  const ownedSnapshot = { ...snapshot, userId: recoveryUserId }
  writePaymentRecoverySnapshot(window.localStorage, ownedSnapshot, PAYMENT_RECOVERY_STORAGE_KEY)
}

function removeRecoverySnapshot() {
  if (typeof window === 'undefined') return
  clearPaymentRecoverySnapshot(window.localStorage, PAYMENT_RECOVERY_STORAGE_KEY)
}

function resetPayment() {
  paymentPhase.value = 'select'
  paymentState.value = emptyPaymentState()
  removeRecoverySnapshot()
}

async function redirectToPaymentResult(state: PaymentRecoverySnapshot): Promise<void> {
  const query: Record<string, string | undefined> = {}
  if (state.orderId > 0) {
    query.order_id = String(state.orderId)
  }
  if (state.outTradeNo) {
    query.out_trade_no = state.outTradeNo
  }
  if (state.resumeToken) {
    query.resume_token = state.resumeToken
  }
  await router.push({
    path: '/payment/result',
    query,
  })
}

function buildWechatOAuthAuthorizeUrl(
  authorizeUrl: string,
  context: { paymentType: string; orderType: OrderType; planId?: number; orderAmount: number },
): string {
  const normalizedUrl = authorizeUrl.trim()
  if (!normalizedUrl || typeof window === 'undefined') {
    return normalizedUrl
  }

  try {
    const targetUrl = new URL(normalizedUrl, window.location.origin)
    const redirectPath = route.path
    const redirectUrl = new URL(redirectPath, window.location.origin)
    const paymentType = normalizeVisibleMethod(context.paymentType) || context.paymentType.trim() || 'wxpay'

    redirectUrl.searchParams.set('payment_type', paymentType)
    redirectUrl.searchParams.set('order_type', context.orderType)

    if (context.planId) {
      redirectUrl.searchParams.set('plan_id', String(context.planId))
    } else {
      redirectUrl.searchParams.delete('plan_id')
    }

    if (context.orderAmount > 0) {
      redirectUrl.searchParams.set('amount', String(context.orderAmount))
    } else {
      redirectUrl.searchParams.delete('amount')
    }

    targetUrl.searchParams.set('redirect', `${redirectUrl.pathname}${redirectUrl.search}`)
    return targetUrl.toString()
  } catch {
    return normalizedUrl
  }
}

function onPaymentDone() {
  const wasSubscription = paymentState.value.orderType === 'subscription'
  resetPayment()
  selectedPlan.value = null
  if (wasSubscription) {
    subscriptionStore.fetchActiveSubscriptions(true).catch(() => {})
  }
}

async function onPaymentSuccess() {
  const completedPayment = { ...paymentState.value }
  removeRecoverySnapshot()
  authStore.refreshUser()
  if (paymentState.value.orderType === 'subscription') {
    subscriptionStore.fetchActiveSubscriptions(true).catch(() => {})
  }
  await redirectToPaymentResult(completedPayment)
}

function onPaymentSettled() {
  removeRecoverySnapshot()
}

// All checkout data from single API call
const checkout = ref<CheckoutInfoResponse>({
  methods: {}, global_min: 0, global_max: 0,
  plans: [], balance_disabled: false, balance_recharge_multiplier: 1, subscription_usd_to_cny_rate: 0, recharge_fee_rate: 0, help_text: '', help_image_url: '', stripe_publishable_key: '',
  recharge_bonus_tiers: [], recharge_bonus_mode: 'bonus', recharge_bonus_notice: '',
})

const renderedHelpText = computed(() => DOMPurify.sanitize(
  marked.parse(checkout.value.help_text || '', { async: false, gfm: true, breaks: false }),
))

// 充值赠送活动文案：后台 Markdown 配置，空字符串时金额卡顶部不渲染
const renderedBonusNotice = computed(() => {
  const raw = (checkout.value.recharge_bonus_notice || '').trim()
  if (!raw) return ''
  return DOMPurify.sanitize(marked.parse(raw, { async: false, gfm: true, breaks: true }))
})

// 订阅功能开关（public settings 的 subscription_enabled，opt-out）。关闭后购买页只保留充值：
// 不再渲染「订阅」tab，只剩单个 tab 时顶部切换器也随之隐藏。
const subscriptionEnabled = computed(() => resolveFeatureFlag(appStore.cachedPublicSettings, FeatureFlags.subscription))

const tabs = computed(() => {
  const result: { key: 'recharge' | 'subscription'; label: string }[] = []
  if (!checkout.value.balance_disabled) result.push({ key: 'recharge', label: t('payment.tabTopUp') })
  if (subscriptionEnabled.value) result.push({ key: 'subscription', label: t('payment.tabSubscribe') })
  return result
})

// tab 列表随 checkout（balance_disabled）与订阅开关变化。当前 tab 不在列表里时收敛到第一个可用 tab，
// 两个方向都覆盖：关闭订阅 → 回到充值；仅订阅站点重新打开订阅 → 进入订阅。列表为空时模板展示不可用提示。
watch(tabs, (available) => {
  if (available.some((tab) => tab.key === activeTab.value)) return
  const leavingSubscription = activeTab.value === 'subscription'
  activeTab.value = available[0]?.key ?? 'recharge'
  if (leavingSubscription) selectedPlan.value = null
})

const visibleMethods = computed(() => getVisibleMethods(checkout.value.methods))
const enabledMethods = computed(() => Object.keys(visibleMethods.value))
const validAmount = computed(() => amount.value ?? 0)
const balanceRechargeMultiplier = computed(() => {
  const multiplier = checkout.value.balance_recharge_multiplier
  return Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1
})
// 订阅 CNY 换算汇率（1 USD = X CNY）。0 = 未配置，订阅保持 price 直付（与后端 opt-in 条件严格镜像）。
const subscriptionUsdToCnyRate = computed(() => {
  const rate = checkout.value.subscription_usd_to_cny_rate
  return Number.isFinite(rate) && rate > 0 ? rate : 0
})
const rechargeBonusTiers = computed(() => normalizeRechargeBonusTiers(checkout.value.recharge_bonus_tiers))
const rechargeBonusMode = computed(() => normalizeRechargeBonusMode(checkout.value.recharge_bonus_mode))

// Adaptive grid: center single card, 2-col for 2 plans, 3-col for 3+
const planGridClass = computed(() => {
  const n = checkout.value.plans.length
  if (n <= 2) return 'grid grid-cols-1 gap-5 sm:grid-cols-2'
  return 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'
})

// Check if an amount fits a method's [min, max]. 0 = no limit.
function amountFitsMethod(amt: number, methodType: string): boolean {
  if (amt <= 0) return true
  const ml = visibleMethods.value[methodType]
  if (!ml) return false
  if (ml.single_min > 0 && amt < ml.single_min) return false
  if (ml.single_max > 0 && amt > ml.single_max) return false
  return true
}

// Visible methods decide the amount range shown to users.
const globalMinAmount = computed(() => {
  const limits = Object.values(visibleMethods.value)
  if (limits.length === 0) return 0
  if (limits.some(limit => limit.single_min <= 0)) return 0
  return Math.min(...limits.map(limit => limit.single_min))
})
const globalMaxAmount = computed(() => {
  const limits = Object.values(visibleMethods.value)
  if (limits.length === 0) return 0
  if (limits.some(limit => limit.single_max <= 0)) return 0
  return Math.max(...limits.map(limit => limit.single_max))
})

// Selected method's limits (for validation and error messages)
const selectedLimit = computed(() => visibleMethods.value[selectedMethod.value])
const selectedCurrency = computed(() => normalizePaymentCurrency(selectedLimit.value?.currency))
const localeCode = computed(() => {
  const raw = i18n.locale as unknown
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && 'value' in raw) {
    return String((raw as { value?: string }).value || '')
  }
  return undefined
})

function currencyFractionDigits(currency: string): number {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  } catch {
    return 2
  }
}

function roundPaymentAmount(value: number, currency: string): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** currencyFractionDigits(currency)
  return Math.round(value * factor) / factor
}

function ceilPaymentAmount(value: number, currency: string): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** currencyFractionDigits(currency)
  return Math.ceil(value * factor) / factor
}

function subscriptionPaymentAmountForCurrency(value: number, currency: string): number {
  const rate = subscriptionUsdToCnyRate.value
  if (rate <= 0 || currency !== DEFAULT_PAYMENT_CURRENCY) return roundPaymentAmount(value, currency)
  return roundPaymentAmount(value * rate, currency)
}

function formatSelectedPaymentAmount(value: number): string {
  return formatPaymentAmount(value, selectedCurrency.value, localeCode.value)
}

function formatSelectedSubscriptionPaymentAmount(value: number): string {
  return formatSelectedPaymentAmount(subscriptionPaymentAmountForCurrency(value, selectedCurrency.value))
}

// 充值优惠：阈值按输入金额命中；赠金模式按到账基数（输入 × 倍率）加赠送，折扣模式按百分比减实付。
// 与后端 quoteRechargeBonus 一致；渠道限额、手续费、实付都按折后基数（payBaseAmount）计算，提交仍发送输入金额。
const bonusQuote = computed(() => quoteRechargeBonus(rechargeBonusTiers.value, validAmount.value, {
  multiplier: balanceRechargeMultiplier.value,
  mode: rechargeBonusMode.value,
  currencyDigits: currencyFractionDigits(selectedCurrency.value),
}))
const payBaseAmount = computed(() => bonusQuote.value.payBase)
const discountAmount = computed(() => roundPaymentAmount(validAmount.value - payBaseAmount.value, selectedCurrency.value))
const creditedAmount = computed(() => bonusQuote.value.credited)
const showBonusRow = computed(() => bonusQuote.value.mode !== 'discount' && bonusQuote.value.bonus > 0)

const methodOptions = computed<PaymentMethodOption[]>(() =>
  enabledMethods.value.map((type) => {
    const ml = visibleMethods.value[type]
    return {
      type,
      display_name: ml?.display_name,
      fee_rate: ml?.fee_rate ?? 0,
      available: ml?.available !== false && amountFitsMethod(payBaseAmount.value, type),
    }
  })
)

const feeRate = computed(() => checkout.value?.recharge_fee_rate ?? 0)
const feeAmount = computed(() =>
  feeRate.value > 0 && payBaseAmount.value > 0
    ? Math.ceil(((payBaseAmount.value * feeRate.value) / 100) * 100) / 100
    : 0
)
const totalAmount = computed(() =>
  feeRate.value > 0 && payBaseAmount.value > 0
    ? Math.round((payBaseAmount.value + feeAmount.value) * 100) / 100
    : payBaseAmount.value
)

const amountError = computed(() => {
  if (validAmount.value <= 0) return ''
  // No method can handle this amount
  if (!enabledMethods.value.some((m) => amountFitsMethod(payBaseAmount.value, m))) {
    return t('payment.amountNoMethod')
  }
  // Selected method can't handle this amount (but others can)
  const ml = selectedLimit.value
  if (ml) {
    if (ml.single_min > 0 && payBaseAmount.value < ml.single_min) return t('payment.amountTooLow', { min: formatSelectedPaymentAmount(ml.single_min) })
    if (ml.single_max > 0 && payBaseAmount.value > ml.single_max) return t('payment.amountTooHigh', { max: formatSelectedPaymentAmount(ml.single_max) })
  }
  return ''
})

const canSubmit = computed(() =>
  validAmount.value > 0
    && amountFitsMethod(payBaseAmount.value, selectedMethod.value)
    && selectedLimit.value?.available !== false
)

const subPaymentAmount = computed(() => {
  const price = selectedPlan.value?.price ?? 0
  return subscriptionPaymentAmountForCurrency(price, selectedCurrency.value)
})

const subFeeAmount = computed(() => {
  if (feeRate.value <= 0 || subPaymentAmount.value <= 0) return 0
  return ceilPaymentAmount((subPaymentAmount.value * feeRate.value) / 100, selectedCurrency.value)
})

const subTotalAmount = computed(() => {
  if (feeRate.value <= 0 || subPaymentAmount.value <= 0) return subPaymentAmount.value
  return roundPaymentAmount(subPaymentAmount.value + subFeeAmount.value, selectedCurrency.value)
})

function subscriptionTotalAmountForCurrency(value: number, currency: string): number {
  const paymentAmount = subscriptionPaymentAmountForCurrency(value, currency)
  if (feeRate.value <= 0 || paymentAmount <= 0) return paymentAmount
  const fee = ceilPaymentAmount((paymentAmount * feeRate.value) / 100, currency)
  return roundPaymentAmount(paymentAmount + fee, currency)
}

// Subscription-specific: method options based on gateway pay amount
const subMethodOptions = computed<PaymentMethodOption[]>(() => {
  const price = selectedPlan.value?.price ?? 0
  return enabledMethods.value.map((type) => {
    const ml = visibleMethods.value[type]
    const currency = normalizePaymentCurrency(ml?.currency)
    return {
      type,
      display_name: ml?.display_name,
      fee_rate: ml?.fee_rate ?? 0,
      available: ml?.available !== false && amountFitsMethod(subscriptionTotalAmountForCurrency(price, currency), type),
    }
  })
})

const canSubmitSubscription = computed(() =>
  selectedPlan.value !== null
    && amountFitsMethod(subTotalAmount.value, selectedMethod.value)
    && selectedLimit.value?.available !== false
)

// Auto-switch to first available method when current selection can't handle the amount
watch(() => [payBaseAmount.value, selectedMethod.value] as const, ([amt, method]) => {
  if (amt <= 0 || amountFitsMethod(amt, method)) return
  const available = enabledMethods.value.find((m) => amountFitsMethod(amt, m))
  if (available) selectedMethod.value = available
})

// Payment button class: follows selected payment method color
const paymentButtonClass = computed(() => {
  const m = selectedMethod.value
  if (!m) return 'btn-primary'
  if (isBuiltInAlipayMethod(m)) return 'btn-alipay'
  if (isBuiltInWxpayMethod(m)) return 'btn-wxpay'
  if (m === 'stripe') return 'btn-stripe'
  if (m === 'airwallex') return 'btn-airwallex'
  return 'btn-primary'
})

// Subscription confirm: platform accent colors (clean card, no gradient)
const planBadgeClass = computed(() => platformBadgeClass(selectedPlan.value?.group_platform || ''))
const planTextClass = computed(() => platformTextClass(selectedPlan.value?.group_platform || ''))

// Renewal modal state
const showRenewalModal = ref(false)
const renewGroupId = ref<number | null>(null)
const renewalPlans = computed(() => {
  if (renewGroupId.value == null) return []
  return checkout.value.plans.filter(p => p.group_id === renewGroupId.value)
})

const planValiditySuffix = computed(() => {
  if (!selectedPlan.value) return ''
  return validitySuffixOf(selectedPlan.value, t)
})

function planHasPeakRate(plan: SubscriptionPlan): boolean {
  return hasPeakRate(plan)
}

function planPeakRateLabel(plan: SubscriptionPlan): string {
  return formatPeakRateWindow(plan, serverTimezoneLabel(appStore.cachedPublicSettings?.server_utc_offset))
}

function selectPlan(plan: SubscriptionPlan) {
  selectedPlan.value = plan
  errorMessage.value = ''
}

function selectPlanFromModal(plan: SubscriptionPlan) {
  showRenewalModal.value = false
  renewGroupId.value = null
  selectedPlan.value = plan
  errorMessage.value = ''
}

function closeRenewalModal() {
  showRenewalModal.value = false
  renewGroupId.value = null
}

async function handleSubmitRecharge() {
  if (!canSubmit.value || submitting.value) return
  await createOrder(validAmount.value, 'balance')
}

async function confirmSubscribe() {
  if (!selectedPlan.value || submitting.value) return
  await createOrder(selectedPlan.value.price, 'subscription', selectedPlan.value.id)
}

async function createOrder(orderAmount: number, orderType: OrderType, planId?: number, options: CreateOrderOptions = {}) {
  submitting.value = true
  errorMessage.value = ''
  errorHintMessage.value = ''
  const requestType = normalizeVisibleMethod(options.paymentType || selectedMethod.value) || options.paymentType || selectedMethod.value
  try {
    const payload = buildCreateOrderPayload({
      amount: orderAmount,
      paymentType: requestType,
      orderType,
      planId,
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      isMobile: isMobileDevice(),
      isWechatBrowser: typeof window !== 'undefined' && /MicroMessenger/i.test(window.navigator.userAgent),
      forceQRCode: !!(checkout.value.alipay_force_qrcode && normalizeVisibleMethod(requestType) === 'alipay'),
      mobilePrecreateDeepLink: checkout.value.alipay_mobile_precreate_deep_link === true,
    })
    if (options.openid) {
      payload.openid = options.openid
    }
    if (options.wechatResumeToken) {
      payload.wechat_resume_token = options.wechatResumeToken
    }

    const result = await paymentStore.createOrder(payload) as CreateOrderResult & { resume_token?: string }
    const openWindow = (url: string) => {
      const win = window.open(url, 'paymentPopup', getPaymentPopupFeatures())
      if (!win || win.closed) {
        window.location.href = url
      }
    }
    const visibleMethod = normalizeVisibleMethod(requestType) || requestType
    // When user clicks the dedicated Stripe button, leave method blank so the
    // landing page renders Stripe's full Payment Element (card/link/alipay/wxpay).
    const stripeMethod = visibleMethod === 'stripe'
      ? ''
      : visibleMethod === 'wxpay' ? 'wechat_pay' : 'alipay'
    const stripeRouteUrl = result.client_secret && visibleMethod !== 'airwallex'
      ? router.resolve({
        path: '/payment/stripe',
        query: {
          order_id: String(result.order_id),
          method: stripeMethod || undefined,
          resume_token: result.resume_token || undefined,
        },
      }).href
      : ''
    const airwallexRouteUrl = result.client_secret && result.intent_id
      ? router.resolve({
        path: '/payment/airwallex',
        query: {
          order_id: String(result.order_id),
          out_trade_no: result.out_trade_no || undefined,
          resume_token: result.resume_token || undefined,
        },
      }).href
      : ''
    const decision = decidePaymentLaunch(result, {
      visibleMethod,
      orderType,
      isMobile: isMobileDevice(),
      isWechatBrowser: typeof window !== 'undefined' && /MicroMessenger/i.test(window.navigator.userAgent),
      forceQRCode: !!(checkout.value.alipay_force_qrcode && visibleMethod === 'alipay'),
      mobilePrecreateDeepLink: checkout.value.alipay_mobile_precreate_deep_link === true,
      stripePopupUrl: stripeRouteUrl,
      stripeRouteUrl,
      airwallexRouteUrl,
    })

    if (decision.kind === 'wechat_oauth' && decision.oauth?.authorize_url) {
      window.location.href = buildWechatOAuthAuthorizeUrl(decision.oauth.authorize_url, {
        paymentType: visibleMethod,
        orderType,
        planId,
        orderAmount,
      })
      return
    }

    if (decision.kind === 'unhandled') {
      applyScenarioError({ reason: 'UNHANDLED_PAYMENT_SCENARIO' }, visibleMethod)
      return
    }

    paymentState.value = decision.paymentState
    paymentPhase.value = 'paying'
    persistRecoverySnapshot(decision.recovery)

    if (decision.kind === 'stripe_popup') {
      openWindow(decision.paymentState.payUrl)
      return
    }
    if (decision.kind === 'stripe_route') {
      window.location.href = decision.paymentState.payUrl
      return
    }
    if (decision.kind === 'airwallex_route') {
      window.location.href = decision.paymentState.payUrl
      return
    }
    if (decision.kind === 'wechat_jsapi' && decision.jsapi) {
      try {
        const jsapiResult = await invokeWechatJsapiPayment(decision.jsapi as Record<string, unknown>)
        const errMsg = String(jsapiResult.err_msg || '').toLowerCase()
        if (errMsg.includes('cancel')) {
          appStore.showInfo(t('payment.qr.cancelled'))
          resetPayment()
        } else if (errMsg && !errMsg.includes('ok')) {
          resetPayment()
          const fallbackApplied = await attemptMobileQrFallback(
            { reason: 'WECHAT_JSAPI_FAILED', message: errMsg },
            {
              orderAmount,
              orderType,
              planId,
              paymentType: visibleMethod,
              attempted: options.mobileQrFallbackAttempted === true,
            },
          )
          if (!fallbackApplied) {
            applyScenarioError({ reason: 'WECHAT_JSAPI_FAILED', message: errMsg }, visibleMethod)
          }
        } else {
          const resultState = { ...decision.paymentState }
          resetPayment()
          await redirectToPaymentResult(resultState)
        }
      } catch (err: unknown) {
        resetPayment()
        const fallbackApplied = await attemptMobileQrFallback(err, {
          orderAmount,
          orderType,
          planId,
          paymentType: visibleMethod,
          attempted: options.mobileQrFallbackAttempted === true,
        })
        if (!fallbackApplied) {
          throw err
        }
      }
      return
    }
    if (decision.kind === 'redirect_waiting' && decision.paymentState.payUrl) {
      if (isMobileDevice()) {
        window.location.href = decision.paymentState.payUrl
        return
      }
      openWindow(decision.paymentState.payUrl)
    }
  } catch (err: unknown) {
    const apiErr = err as Record<string, unknown>
    if (apiErr.reason === 'TOO_MANY_PENDING') {
      const metadata = apiErr.metadata as Record<string, unknown> | undefined
      errorMessage.value = t('payment.errors.tooManyPending', { max: metadata?.max || '' })
      errorHintMessage.value = ''
    } else if (apiErr.reason === 'CANCEL_RATE_LIMITED') {
      errorMessage.value = t('payment.errors.cancelRateLimited')
      errorHintMessage.value = ''
    } else if (await attemptMobileQrFallback(err, {
      orderAmount,
      orderType,
      planId,
      paymentType: requestType,
      attempted: options.mobileQrFallbackAttempted === true,
    })) {
      return
    } else {
      const handled = applyScenarioError(
        err,
        normalizeVisibleMethod(options.paymentType || selectedMethod.value) || selectedMethod.value,
      )
      if (!handled) {
        errorMessage.value = extractI18nErrorMessage(err, t, 'payment.errors', extractApiErrorMessage(err, t('payment.result.failed')))
        errorHintMessage.value = ''
      }
      if (handled) {
        return
      }
    }
    appStore.showError(buildPaymentErrorToastMessage(errorMessage.value, errorHintMessage.value))
  } finally {
    submitting.value = false
  }
}

interface MobileQrFallbackContext {
  orderAmount: number
  orderType: OrderType
  planId?: number
  paymentType: string
  attempted: boolean
}

function shouldFallbackToDesktopQr(err: unknown, paymentMethod: string, attempted: boolean): boolean {
  if (attempted || !isMobileDevice()) {
    return false
  }

  const normalizedMethod = normalizeVisibleMethod(paymentMethod) || paymentMethod
  const reason = typeof err === 'object' && err && 'reason' in err && typeof err.reason === 'string'
    ? err.reason
    : ''
  const message = err instanceof Error
    ? err.message
    : (typeof err === 'object' && err && 'message' in err && typeof err.message === 'string'
      ? err.message
      : '')
  const normalizedMessage = message.toLowerCase()

  if (normalizedMethod === 'wxpay') {
    return reason === 'WECHAT_H5_NOT_AUTHORIZED'
      || reason === 'WECHAT_PAYMENT_MP_NOT_CONFIGURED'
      || reason === 'WECHAT_JSAPI_FAILED'
      || reason === 'PAYMENT_GATEWAY_ERROR'
      || reason === 'UNHANDLED_PAYMENT_SCENARIO'
      || normalizedMessage.includes('weixinjsbridge is unavailable')
      || normalizedMessage.includes('wechat_jsapi_unavailable')
  }

  if (normalizedMethod === 'alipay') {
    return reason === 'PAYMENT_GATEWAY_ERROR' || reason === 'UNHANDLED_PAYMENT_SCENARIO'
  }

  return false
}

async function attemptMobileQrFallback(err: unknown, context: MobileQrFallbackContext): Promise<boolean> {
  if (!shouldFallbackToDesktopQr(err, context.paymentType, context.attempted)) {
    return false
  }

  try {
    const visibleMethod = normalizeVisibleMethod(context.paymentType) || context.paymentType
    const payload = buildCreateOrderPayload({
      amount: context.orderAmount,
      paymentType: visibleMethod,
      orderType: context.orderType,
      planId: context.planId,
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      isMobile: false,
      isWechatBrowser: false,
    })
    const result = await paymentStore.createOrder(payload) as CreateOrderResult & { resume_token?: string }
    const stripeMethod = visibleMethod === 'wxpay' ? 'wechat_pay' : 'alipay'
    const stripeRouteUrl = result.client_secret
      ? router.resolve({
        path: '/payment/stripe',
        query: {
          order_id: String(result.order_id),
          method: stripeMethod,
          resume_token: result.resume_token || undefined,
        },
      }).href
      : ''
    const decision = decidePaymentLaunch(result, {
      visibleMethod,
      orderType: context.orderType,
      isMobile: false,
      isWechatBrowser: false,
      stripePopupUrl: stripeRouteUrl,
      stripeRouteUrl,
    })

    if (decision.kind !== 'qr_waiting' || !decision.paymentState.qrCode) {
      return false
    }

    errorMessage.value = ''
    errorHintMessage.value = ''
    paymentState.value = decision.paymentState
    paymentPhase.value = 'paying'
    persistRecoverySnapshot(decision.recovery)
    appStore.showWarning(t('payment.errors.mobilePaymentFallbackToQr'))
    return true
  } catch {
    return false
  }
}

function applyScenarioError(err: unknown, paymentMethod: string): boolean {
  const descriptor = describePaymentScenarioError(err, {
    paymentMethod,
    isMobile: isMobileDevice(),
    isWechatBrowser: typeof window !== 'undefined' && /MicroMessenger/i.test(window.navigator.userAgent),
  })
  if (!descriptor) {
    errorMessage.value = ''
    errorHintMessage.value = ''
    return false
  }
  errorMessage.value = t(descriptor.messageKey)
  errorHintMessage.value = descriptor.hintKey ? t(descriptor.hintKey) : ''
  appStore.showError(buildPaymentErrorToastMessage(errorMessage.value, errorHintMessage.value))
  return true
}

async function resumeWechatPaymentFromQuery() {
  const resume = parseWechatResumeRoute(route.query, checkout.value.plans, validAmount.value)
  if (!resume) {
    return
  }

  selectedMethod.value = resume.paymentType
  if (resume.orderType === 'balance' && resume.orderAmount > 0) {
    amount.value = resume.orderAmount
  }
  if (resume.orderType === 'subscription' && resume.planId) {
    selectedPlan.value = checkout.value.plans.find(plan => plan.id === resume.planId) ?? null
  }

  await router.replace({ path: route.path, query: stripWechatResumeQuery(route.query) })

  if (resume.wechatResumeToken) {
    await createOrder(0, resume.orderType, resume.planId, {
      wechatResumeToken: resume.wechatResumeToken,
      paymentType: resume.paymentType,
      isResume: true,
    })
    return
  }

  if (resume.orderAmount > 0 && resume.openid) {
    await createOrder(resume.orderAmount, resume.orderType, resume.planId, {
      openid: resume.openid,
      paymentType: resume.paymentType,
      isResume: true,
    })
  }
}

onMounted(async () => {
  try {
    const res = await paymentAPI.getCheckoutInfo()
    checkout.value = res.data
    if (enabledMethods.value.length) {
      const order: readonly string[] = METHOD_ORDER
      const sorted = [...enabledMethods.value].sort((a, b) => {
        const ai = order.indexOf(a)
        const bi = order.indexOf(b)
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      })
      selectedMethod.value = sorted[0]
    }
    if (typeof window !== 'undefined') {
      if (hasWechatResumeQuery(route.query)) {
        removeRecoverySnapshot()
      }
      const routeResumeToken = typeof route.query.resume_token === 'string'
        ? route.query.resume_token
        : typeof route.query.wechat_resume_token === 'string'
          ? route.query.wechat_resume_token
          : undefined
      const rawSnapshot = window.localStorage.getItem(PAYMENT_RECOVERY_STORAGE_KEY)
      const restored = readPaymentRecoverySnapshot(
        rawSnapshot,
        { resumeToken: routeResumeToken },
      )
      if (restored && user.value?.id && JSON.parse(rawSnapshot!).userId === user.value.id) {
        paymentState.value = restored
        paymentPhase.value = 'paying'
        const restoredMethod = normalizeVisibleMethod(restored.paymentType)
          || (visibleMethods.value[restored.paymentType] ? restored.paymentType : '')
        if (restoredMethod) {
          selectedMethod.value = restoredMethod
        }
      } else {
        removeRecoverySnapshot()
      }
    }
    await resumeWechatPaymentFromQuery()
    // balance_disabled → the tabs watcher above moves activeTab to the subscription tab (when enabled).
    // Handle renewal navigation: ?tab=subscription&group=123 (ignored when subscriptions are disabled)
    if (route.query.tab === 'subscription' && subscriptionEnabled.value) {
      activeTab.value = 'subscription'
      if (route.query.group) {
        const groupId = Number(route.query.group)
        const groupPlans = checkout.value.plans.filter(p => p.group_id === groupId)
        if (groupPlans.length === 1) {
          selectedPlan.value = groupPlans[0]
        } else if (groupPlans.length > 1) {
          renewGroupId.value = groupId
          showRenewalModal.value = true
        }
      }
    }
  } catch (err: unknown) { appStore.showError(extractI18nErrorMessage(err, t, 'payment.errors', t('common.error'))) }
  finally { loading.value = false }
  // Fetch active subscriptions (uses cache, non-blocking); skipped when the subscription feature is off
  if (subscriptionEnabled.value) {
    subscriptionStore.fetchActiveSubscriptions().catch(() => {})
  }
})
</script>

<style scoped>
.balance-recharge { --re-bg:#fff; --re-soft:#f0f8f5; --re-line:#dfebe5; --re-ink:#18372e; --re-muted:#74877f; --re-accent:#087f65; --re-warm-bg:#fff1df; --re-warm:#a3570b; max-width:1120px; color:var(--re-ink); }
.dark .balance-recharge { --re-bg:#15231e; --re-soft:#1b3027; --re-line:#2b4036; --re-ink:#e5f2eb; --re-muted:#9eb4a7; --re-accent:#6ddbb3; --re-warm-bg:#392d19; --re-warm:#f4bd77; }
.re-hero { display:flex; justify-content:space-between; align-items:center; gap:32px; padding:16px 0 32px; }
.re-eyebrow { display:flex; align-items:center; gap:7px; color:var(--re-accent); font-size:9px; font-weight:650; letter-spacing:.16em; }
.re-eyebrow i { width:6px; height:6px; border-radius:50%; background:var(--re-accent); box-shadow:0 0 0 4px var(--re-soft); }
.re-hero h1 { margin:15px 0 14px; font-size:36px; font-weight:750; letter-spacing:-.04em; line-height:1.35; }
.re-hero h1 em { font-style:normal; color:var(--re-accent); }
.re-hero-copy > p { max-width:460px; font-size:12px; line-height:1.9; color:var(--re-muted); }
.re-hero-tags { display:flex; flex-wrap:wrap; gap:8px 16px; margin-top:18px; font-size:10px; color:var(--re-muted); }
.re-hero-tags span::before { content:'✓'; margin-right:6px; color:var(--re-accent); }
.re-balance-card { position:relative; isolation:isolate; overflow:hidden; flex:0 0 330px; padding:24px; border:1px solid #35634f; border-radius:18px; color:#f1fff7; background:radial-gradient(ellipse at 90% 0,#47866970,transparent 70%),linear-gradient(120deg,#163b2f,#24563e); box-shadow:0 14px 35px -24px #12422b90; }
.re-balance-top { display:flex; justify-content:space-between; align-items:center; gap:12px; color:#b5d6c4; font-size:11px; }
.re-balance-card > strong { position:relative; display:flex; align-items:baseline; gap:7px; margin:24px 0 23px; font-size:39px; line-height:1.1; letter-spacing:-.04em; font-weight:650; font-variant-numeric:tabular-nums; }
.re-balance-card > strong small:first-child { font-size:24px; font-weight:400; }
.re-balance-card > strong small:last-child { margin-left:2px; font-size:10px; color:#b5d6c4; letter-spacing:.08em; font-weight:500; }
.re-balance-bottom { position:relative; display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; border-top:1px solid #b1d6bd33; padding-top:13px; font-size:10px; color:#b5d6c4; }
.re-balance-bottom > span { max-width:190px; overflow-wrap:anywhere; }
.re-balance-bottom a { color:#e3f8eb; }
.re-card-orbit { position:absolute; z-index:-1; width:240px; height:240px; right:-110px; top:-110px; border:1px solid #e5f8e71a; border-radius:50%; box-shadow:0 0 0 24px #e5f8e708,0 0 0 48px #e5f8e706,0 0 0 72px #e5f8e704; }
.re-panel { min-width:0; padding:25px; border:1px solid var(--re-line); border-radius:15px; background:var(--re-bg); }
.re-tabs { display:flex; gap:4px; width:fit-content; max-width:100%; padding:4px; border:1px solid var(--re-line); border-radius:10px; background:var(--re-soft); }
.re-tabs button { padding:9px 24px; border:1px solid transparent; border-radius:7px; color:var(--re-muted); font-size:12px; }
.re-tabs .active { border-color:var(--re-line); background:var(--re-bg); color:var(--re-accent); font-weight:650; box-shadow:0 2px 4px #102b2408; }
.re-checkout-grid { display:grid; grid-template-columns:minmax(0,1fr) 335px; align-items:start; gap:22px; }
.re-form { display:flex; min-width:0; flex-direction:column; gap:20px; }
.re-section-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.re-section-heading h2 { margin-top:7px; font-size:17px; font-weight:650; letter-spacing:-.02em; }
.re-currency-tag { border:1px solid var(--re-line); border-radius:6px; padding:4px 7px; color:var(--re-muted); font-size:10px; letter-spacing:.06em; }
.re-section-description { margin:10px 0 22px; color:var(--re-muted); font-size:11px; line-height:1.8; }
.re-notice { padding:12px 14px; margin-bottom:20px; border:1px solid color-mix(in srgb,var(--re-warm) 20%,var(--re-line)); border-radius:10px; background:var(--re-warm-bg); color:var(--re-warm); font-size:11px; line-height:1.8; overflow-wrap:anywhere; }
.re-notice :deep(p) { margin:0; }
.re-method-panel :deep([data-testid=payment-method-grid]) { grid-template-columns:repeat(2,minmax(0,1fr)); }
.re-method-panel :deep(label) { display:none; }
.re-method-panel :deep([data-testid=payment-method-grid] > button) { height:66px; border-radius:10px; }
.re-method-panel :deep([data-testid=payment-method-label]) { font-size:13px; }
.re-method-panel :deep(img) { width:24px; height:24px; }
.re-quiet-note { display:flex; align-items:flex-start; gap:8px; padding:0 4px; color:var(--re-muted); font-size:10px; line-height:1.9; }
.re-quiet-note > svg { margin-top:2px; flex-shrink:0; }
.re-quiet-note a { color:var(--re-accent); white-space:nowrap; }
.re-summary { position:sticky; top:88px; padding:23px; }
.re-summary > .re-section-heading > svg { color:var(--re-muted); }
.re-credit-hero { margin:22px 0; padding:20px 16px; border:1px solid var(--re-line); border-radius:12px; background:radial-gradient(ellipse at 100% 0,color-mix(in srgb,var(--re-accent) 9%,transparent),transparent 75%),var(--re-soft); }
.re-credit-hero > span:first-child { display:flex; align-items:center; gap:7px; font-size:11px; font-weight:550; }
.re-credit-hero > span:first-child small { padding:2px 4px; border:1px solid var(--re-line); border-radius:4px; font-size:8px; color:var(--re-muted); }
.re-credit-hero > strong { display:flex; align-items:baseline; gap:4px; margin:10px 0; color:var(--re-accent); font-size:40px; line-height:1.2; font-weight:750; letter-spacing:-.045em; font-variant-numeric:tabular-nums; overflow-wrap:anywhere; }
.re-credit-hero > strong small { font-size:23px; font-weight:500; }
.re-credit-hero > p { margin-top:9px; color:var(--re-muted); font-size:9px; line-height:1.7; }
.re-benefit-tag { display:inline-block; padding:4px 8px; border-radius:6px; background:var(--re-warm-bg); color:var(--re-warm); font-size:11px; font-weight:650; }
.re-breakdown { display:flex; flex-direction:column; gap:13px; padding-bottom:21px; font-size:11px; }
.re-breakdown > div { display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; gap:8px; }
.re-breakdown dt { color:var(--re-muted); }
.re-breakdown dd { font-weight:550; font-variant-numeric:tabular-nums; overflow-wrap:anywhere; }
.re-breakdown small { margin-left:3px; font-size:9px; }
.re-breakdown .re-benefit-row dt,.re-breakdown .re-benefit-row dd { color:var(--re-warm); }
.re-total { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px; padding:20px 0; border-top:1px dashed var(--re-line); }
.re-total > span { font-size:12px; font-weight:600; }
.re-total small { display:block; margin-top:4px; color:var(--re-muted); font-size:9px; font-weight:400; }
.re-total strong { font-size:27px; font-weight:750; letter-spacing:-.035em; font-variant-numeric:tabular-nums; overflow-wrap:anywhere; }
.re-pay-button { display:flex; align-items:center; justify-content:center; gap:12px; width:100%; padding:14px; border:1px solid #087f65; border-radius:10px; background:#087f65; color:white; font-size:13px; font-weight:650; box-shadow:0 5px 12px -7px #087f6580; transition:background .15s; }
.re-pay-button:hover:not(:disabled) { background:#066650; }
.re-pay-button:disabled { opacity:.45; cursor:not-allowed; box-shadow:none; }
.dark .re-pay-button { background:#238e71; border-color:#40a88b; }
.re-payment-note { margin:10px 0 20px; text-align:center; color:var(--re-muted); font-size:9px; }
.re-account { display:flex; align-items:center; gap:9px; padding-top:18px; border-top:1px solid var(--re-line); }
.re-avatar { display:flex; align-items:center; justify-content:center; flex-shrink:0; width:31px; height:31px; border:1px solid var(--re-line); border-radius:9px; background:var(--re-soft); color:var(--re-accent); font-size:12px; font-weight:650; }
.re-account > div { flex:1; min-width:0; }
.re-account > div > span { display:block; font-size:9px; color:var(--re-muted); }
.re-account strong { display:block; margin-top:3px; font-size:11px; font-weight:550; overflow-wrap:anywhere; }
.re-account > a { flex-shrink:0; font-size:10px; color:var(--re-accent); }
.re-empty { text-align:center; color:var(--re-muted); padding-block:60px; }
.re-load-error { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; color:var(--re-warm); font-size:13px; }
.re-load-error button { padding:8px 12px; border-radius:6px; background:var(--re-soft); color:var(--re-accent); }
.re-inline-error { border:1px solid color-mix(in srgb,var(--re-warm) 30%,var(--re-line)); border-radius:10px; padding:13px 16px; background:var(--re-warm-bg); color:var(--re-warm); font-size:12px; line-height:1.8; }
.re-spinner { width:14px; height:14px; border:2px solid #ffffff55; border-top-color:white; border-radius:50%; animation:re-spin 1s linear infinite; }
@keyframes re-spin { to { transform:rotate(360deg); } }
button:focus-visible,a:focus-visible { outline:2px solid var(--re-accent); outline-offset:3px; }
@media(max-width:1150px) { .re-checkout-grid { grid-template-columns:minmax(0,1fr) 310px; gap:18px; } .re-panel { padding:20px; } .re-hero { gap:22px; } .re-balance-card { flex-basis:290px; } }
@media(max-width:980px) { .re-checkout-grid { grid-template-columns:minmax(0,1fr); } .re-summary { position:static; } .re-hero { align-items:stretch; } .re-hero h1 { font-size:30px; } .re-balance-card { flex-basis:260px; align-self:center; padding:20px; } }
@media(max-width:640px) { .re-hero { flex-direction:column; gap:24px; padding:6px 0 4px; } .re-hero h1 { font-size:31px; } .re-hero-copy > p { font-size:11px; } .re-balance-card { flex-basis:auto; align-self:stretch; } .re-balance-card > strong { margin:18px 0; font-size:34px; } .re-panel { padding:18px; border-radius:13px; } .re-section-heading h2 { font-size:16px; } .re-section-description { margin-bottom:18px; } .re-checkout-grid { gap:18px; } }
@media(prefers-reduced-motion:reduce) { .re-pay-button { transition:none; } .re-spinner { animation:none; } }
</style>
