<template>
  <div class="balance-picker">
    <div class="amount-grid" role="group" :aria-label="zh ? '选择充值金额' : 'Choose top-up amount'">
      <button v-for="value in amounts" :key="value" type="button" class="amount-card" :class="{ selected: modelValue === value }" :aria-pressed="modelValue === value" :data-testid="`balance-amount-${value}`" @click="emit('update:modelValue', value)">
        <span class="amount-card-top"><span>{{ value === 10 ? (zh ? '轻量体验' : 'Try it out') : value === 50 ? (zh ? '日常使用' : 'Everyday') : (zh ? '按需补充' : 'Top up') }}</span><span class="amount-check" aria-hidden="true">{{ modelValue === value ? '✓' : '' }}</span></span>
        <strong class="amount-number"><small>{{ currencySymbol(currency) }}</small>{{ value.toLocaleString() }}</strong>
        <span class="amount-credit">{{ zh ? '到账 ' : 'Credit ' }}<b>${{ quoteFor(value).credited.toFixed(2) }}</b></span>
        <span v-if="quoteFor(value).percent > 0" class="amount-bonus">{{ bonusMode === 'discount' ? (zh ? '立省 ' : 'Save ') : (zh ? '加赠 ' : 'Bonus ') }}{{ formatRechargeBonusNumber(quoteFor(value).percent) }}%</span>
      </button>
    </div>
    <div class="custom-heading"><label for="balance-custom-amount">{{ zh ? '自定义金额' : 'Custom amount' }}</label><span>{{ zh ? '单次最高 ' : 'Up to ' }}{{ formatPaymentAmount(max, currency, locale) }}</span></div>
    <div class="custom-input" :class="{ invalid: !!error }"><span>{{ currencySymbol(currency) }}</span><input id="balance-custom-amount" type="text" inputmode="decimal" autocomplete="off" :value="customText" :placeholder="zh ? '输入你需要的金额' : 'Enter an amount'" :aria-invalid="!!error" aria-describedby="balance-amount-hint" @input="handleInput" /><small>{{ currency }}</small></div>
    <p id="balance-amount-hint" class="amount-hint" :class="{ 'amount-error': !!error }" :role="error ? 'alert' : undefined">{{ error || (zh ? '充值金额按支付币种计价，到账余额以 USD 计算。' : 'Top-up uses the payment currency; account credit is in USD.') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RechargeBonusTier } from '@/types/payment'
import { quoteRechargeBonus, formatRechargeBonusNumber, type RechargeBonusMode } from '@/utils/rechargeBonus'
import { currencySymbol, formatPaymentAmount } from './currency'

const props = defineProps<{
  modelValue: number | null
  amounts: number[]
  max: number
  currency: string
  multiplier: number
  bonusTiers: RechargeBonusTier[]
  bonusMode: RechargeBonusMode
  error: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()
const { locale } = useI18n()
const zh = computed(() => (locale.value || 'zh').startsWith('zh'))
const customText = ref('')
const currencyDigits = computed(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: props.currency }).resolvedOptions().maximumFractionDigits ?? 2)
function quoteFor(value: number) {
  return quoteRechargeBonus(props.bonusTiers, value, { multiplier: props.multiplier, mode: props.bonusMode, currencyDigits: currencyDigits.value })
}
function handleInput(event: Event) {
  const input = event.target as HTMLInputElement
  if (!/^\d*(\.\d{0,2})?$/.test(input.value)) { input.value = customText.value; return }
  customText.value = input.value
  const value = Number.parseFloat(input.value)
  emit('update:modelValue', Number.isFinite(value) && value > 0 ? value : null)
}
watch(() => props.modelValue, value => {
  if (value == null) customText.value = ''
  else if (Number(customText.value) !== value) customText.value = String(value)
}, { immediate: true })
</script>

<style scoped>
.amount-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
.amount-card { display:flex; position:relative; flex-direction:column; align-items:flex-start; min-width:0; padding:15px; border:1px solid var(--re-line,#e2e8f0); border-radius:12px; background:var(--re-bg,#fff); color:var(--re-ink,#18332c); text-align:left; transition:background .15s,border-color .15s,box-shadow .15s; }
.amount-card:hover { border-color:var(--re-accent,#07856a); }
.amount-card.selected { border-color:var(--re-accent,#07856a); background:var(--re-soft,#f0faf7); box-shadow:0 0 0 1px var(--re-accent,#07856a); }
.amount-card-top { display:flex; align-items:center; justify-content:space-between; gap:6px; width:100%; color:var(--re-muted,#64748b); font-size:10px; }
.amount-check { display:flex; align-items:center; justify-content:center; flex-shrink:0; width:14px; height:14px; border:1px solid var(--re-line,#e2e8f0); border-radius:50%; }
.selected .amount-check { background:var(--re-accent,#07856a); border-color:var(--re-accent,#07856a); color:var(--re-bg,#fff); }
.amount-number { display:flex; align-items:baseline; gap:4px; margin:13px 0 7px; font-size:29px; line-height:1.1; font-weight:750; letter-spacing:-.05em; font-variant-numeric:tabular-nums; }
.amount-number small { font-size:14px; font-weight:500; letter-spacing:0; }
.amount-credit { font-size:10px; color:var(--re-muted,#64748b); overflow-wrap:anywhere; }
.amount-credit b { font-weight:600; color:var(--re-ink,#18332c); }
.amount-bonus { margin-top:9px; padding:3px 6px; border-radius:5px; background:var(--re-warm-bg,#fff1de); color:var(--re-warm,#9a5308); font-size:10px; font-weight:700; }
.custom-heading { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:baseline; gap:8px; margin:26px 0 10px; }
.custom-heading label { color:var(--re-ink,#18332c); font-size:12px; font-weight:600; }
.custom-heading > span { color:var(--re-muted,#64748b); font-size:10px; }
.custom-input { display:flex; align-items:center; gap:10px; padding:13px 14px; border:1px solid var(--re-line,#e2e8f0); border-radius:10px; color:var(--re-muted,#64748b); background:var(--re-bg,#fff); }
.custom-input:focus-within { border-color:var(--re-accent,#07856a); outline:2px solid var(--re-soft,#f0faf7); }
.custom-input.invalid { border-color:#c46b24; }
.custom-input input { min-width:0; width:100%; outline:0; border:0; background:transparent; color:var(--re-ink,#18332c); font-size:15px; font-variant-numeric:tabular-nums; }
.custom-input small { font-size:11px; }
.amount-hint { margin-top:9px; color:var(--re-muted,#64748b); font-size:10px; line-height:1.8; }
.amount-error { color:var(--re-warm,#9a5308); }
button:focus-visible { outline:2px solid var(--re-accent,#07856a); outline-offset:3px; }
@media(max-width:450px) { .amount-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; } .amount-number { font-size:27px; } }
@media(prefers-reduced-motion:reduce) { .amount-card { transition:none; } }
</style>
