<template>
  <div v-if="comparison" class="catalog-saving" :class="{ neutral: comparison.max > 1 }" :title="hint">
    <strong>{{ discount }}</strong><span v-if="!compact">{{ saving }}</span>
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
const saving = computed(() => {
  const c = props.comparison!
  if (c.max > 1) return zh.value ? '相对官方参考价' : 'Compared with official'
  return (zh.value ? '节省 ' : 'Save ') + range((1 - c.max) * 100, (1 - c.min) * 100) + '%'
})
const hint = computed(() => zh.value
  ? '按输入、输出单价及可比上下文档位分别计算；范围表示折扣差异。缓存、推理附加倍率与高峰加价不计入，不代表整单节省。'
  : 'Input/output unit prices across comparable context tiers. Cache, reasoning multipliers and peak surcharges excluded; request savings vary.')
</script>
<style scoped>
.catalog-saving { display:inline-flex; flex-direction:column; gap:4px; white-space:nowrap; }
.catalog-saving strong { align-self:flex-start; border:1px solid #a7e5cd; border-radius:7px; background:#ecfdf5; padding:4px 9px; color:#087f5b; font-size:12px; font-weight:700; }
.catalog-saving span { color:#168461; font-size:11px; }
.neutral strong { background:#f1f5f9; color:#64748b; border-color:#e2e8f0; }
.neutral span { color:#64748b; }
.dark .catalog-saving strong { background:#073e34; border-color:#1c6251; color:#8ce5c4; }
.dark .catalog-saving span { color:#81cdb3; }
.dark .neutral strong { background:#263244; border-color:#3b495b; color:#cbd5e1; }
</style>
