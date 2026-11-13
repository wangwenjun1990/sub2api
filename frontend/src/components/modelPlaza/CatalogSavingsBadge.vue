<template>
  <div v-if="comparison" class="catalog-saving" :class="{ neutral: comparison.max >= 1, compact }" :title="hint">
    <strong v-if="comparison.max < 1" class="saving-headline"><span class="saving-label">{{ zh ? '节省 ' : 'Save ' }}</span><span class="saving-value">{{ savingPercent }}</span></strong>
    <strong v-else class="reference-label">{{ zh ? '相对官方参考价' : 'Compared with official' }}</strong>
    <span class="discount-label">{{ zh ? '官方 ' : '' }}{{ discount }}</span>
  </div>
  <span v-else-if="!compact" class="text-xs text-gray-400">{{ zh ? '暂无可比参考价' : 'No comparable reference' }}</span>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CatalogComparison } from './catalogComparison'
const props = defineProps<{ comparison: CatalogComparison | null; compact?: boolean }>()
const { locale } = useI18n()
const zh = computed(() => (locale?.value ?? 'zh').startsWith('zh'))
const number = (value: number) => value > 0 && value < 0.01 ? '<0.01' : String(Number(value.toFixed(2)))
const range = (min: number, max: number) => Math.abs(max - min) < 1e-8 ? number(min) : number(min) + '–' + number(max)
const discount = computed(() => {
  const c = props.comparison!
  return zh.value ? range(c.min * 10, c.max * 10) + ' 折' : range(c.min * 100, c.max * 100) + '% of official'
})
const savingPercent = computed(() => {
  const c = props.comparison!
  return range((1 - c.max) * 100, (1 - c.min) * 100) + '%'
})
const hint = computed(() => zh.value
  ? '按输入、输出单价及可比上下文档位分别计算；范围表示折扣差异。缓存、推理附加倍率与高峰加价不计入，不代表整单节省。'
  : 'Input/output unit prices across comparable context tiers. Cache, reasoning multipliers and peak surcharges excluded; request savings vary.')
</script>
<style scoped>
.catalog-saving { display:inline-flex; max-width:100%; flex-direction:column; align-items:flex-start; gap:7px; font-family:inherit; font-variant-numeric:tabular-nums; text-align:left; }
.saving-headline { display:flex; flex-wrap:wrap; align-items:baseline; column-gap:5px; color:#087453; line-height:1.2; }
.saving-label { font-size:11px; font-weight:650; white-space:nowrap; }
.saving-value { font-size:22px; font-weight:800; letter-spacing:-.045em; overflow-wrap:anywhere; }
.discount-label { padding:3px 8px; border:1px solid #a7e5cd; border-radius:6px; background:#ecfdf5; color:#087453; font-size:11px; font-weight:650; line-height:1.5; }
.compact .saving-value { font-size:25px; }
.reference-label { color:#64748b; font-size:11px; font-weight:500; }
.neutral .discount-label { background:#f1f5f9; color:#475569; border-color:#e2e8f0; }
.dark .saving-headline { color:#6ee7b7; }
.dark .discount-label { background:#073e34; border-color:#1c6251; color:#a7f3d0; }
.dark .reference-label { color:#94a3b8; }
.dark .neutral .discount-label { background:#263244; border-color:#3b495b; color:#cbd5e1; }
</style>
