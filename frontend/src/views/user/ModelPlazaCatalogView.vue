<template>
  <AppLayout>
    <main class="catalog">
      <header class="catalog-hero">
        <div class="hero-copy">
          <span class="eyebrow"><i></i> MODEL DIRECTORY <span>/</span> {{ zh ? '模型广场' : 'Model plaza' }}</span>
          <h1>{{ zh ? '好模型，' : 'Great models.' }}<span>{{ zh ? '好价格。' : 'Clear pricing.' }}</span></h1>
          <p>{{ zh ? '从模型到渠道，一眼找到适合你的选择。实付多少，比官方省多少，清清楚楚。' : 'Find your model and channel. Compare what you pay with official reference prices.' }}</p>
          <div class="hero-tags"><span>USD / 1M tokens</span><span>{{ zh ? '按量计费' : 'Usage based' }}</span><span>{{ zh ? '专属倍率自动生效' : 'Personal rates applied' }}</span></div>
        </div>
        <div class="hero-stats" :aria-busy="loading">
          <div><strong>{{ loading ? '—' : platforms.length }}</strong><span>{{ zh ? '模型平台' : 'Platforms' }}</span></div>
          <div><strong>{{ loading ? '—' : groups.length }}</strong><span>{{ zh ? '可选分组' : 'Groups' }}</span></div>
          <div><strong>{{ loading ? '—' : modelCount }}</strong><span>{{ zh ? '独立模型' : 'Models' }}</span></div>
        </div>
      </header>
      <div v-if="loading" class="state-panel" role="status"><Icon name="refresh" size="lg" class="animate-spin text-primary-500" /><p>{{ zh ? '正在获取模型与价格…' : 'Loading models and pricing…' }}</p></div>
      <div v-else-if="loadFailed" class="state-panel" role="alert"><Icon name="exclamationTriangle" size="lg" class="text-amber-500" /><p>{{ t('modelPlaza.loadFailed') }}</p><button type="button" class="btn btn-secondary" @click="loadCatalog">{{ t('version.retry') }}</button></div>
      <template v-else-if="groups.length">
        <section class="catalog-browser">
          <div class="browser-heading"><div><span class="section-kicker">01 / EXPLORE</span><h2>{{ zh ? '选择你的模型平台' : 'Choose your platform' }}</h2></div><button type="button" class="refresh-button" @click="loadCatalog"><Icon name="refresh" size="sm" />{{ zh ? '刷新价格' : 'Refresh prices' }}</button></div>
          <div class="platform-tabs" :aria-label="t('modelPlaza.filters.platformLabel')">
            <button v-for="platform in platforms" :key="platform" type="button" class="platform-tab" :class="{ active: selectedPlatform === platform }" :aria-pressed="selectedPlatform === platform" @click="selectPlatform(platform)">
              <PlatformIcon :platform="platform as GroupPlatform" size="sm" /><span>{{ platformLabel(platform) }}</span><small>{{ platformGroups(platform).length }}</small>
            </button>
          </div>
          <div class="group-heading"><h3>{{ zh ? '选择分组' : 'Choose a group' }}</h3><span>{{ zh ? '按倍率从低到高排列 · 折扣取决于实际模型价格' : 'Sorted by rate · discounts depend on model prices' }}</span></div>
          <div class="group-grid">
            <button v-for="group in platformGroups(selectedPlatform)" :key="group.id" type="button" class="group-card" :class="{ active: selectedGroupId === group.id }" :aria-pressed="selectedGroupId === group.id" @click="selectedGroupId = group.id">
              <div class="group-top"><span class="group-name">{{ group.name }}</span><span class="selection-mark">{{ selectedGroupId === group.id ? '✓' : '' }}</span></div>
              <p class="group-description">{{ group.description || (zh ? '查看此分组支持的模型与价格' : 'Explore models and pricing in this group') }}</p>
              <div class="group-comparison"><CatalogSavingsBadge :comparison="compareCatalogGroup(group.models, effectiveRate(group))" compact /><span class="group-rate">{{ effectiveRate(group) }}× <small>{{ zh ? '倍率' : 'rate' }}</small></span></div>
              <div class="group-footer"><span>{{ group.models.length }} {{ zh ? '个模型' : 'models' }}</span><span v-if="group.is_exclusive">{{ t('modelPlaza.badges.exclusive') }}</span><span v-if="group.subscription_type === 'subscription'">{{ t('modelPlaza.badges.subscription') }}</span><span v-if="group.user_rate_multiplier != null">{{ zh ? '专属价' : 'Personal rate' }}</span></div>
            </button>
          </div>
        </section>
        <section v-if="activeGroup" class="catalog-pricing">
          <div class="pricing-heading"><div><span class="section-kicker">02 / PRICING</span><h2>{{ activeGroup.name }}<span class="model-count">{{ searchedGroup?.models.length ?? 0 }} {{ zh ? '个模型' : 'models' }}</span></h2></div>
            <label class="search-box"><Icon name="search" size="sm" /><input v-model="searchQuery" type="search" :aria-label="t('modelPlaza.filters.searchPlaceholder')" :placeholder="t('modelPlaza.filters.searchPlaceholder')" /></label>
          </div>
          <div class="pricing-legend"><span class="legend-paid"><i></i>{{ zh ? '实付价格' : 'Your price' }}</span><span>{{ zh ? '官方参考价同屏对照' : 'Official reference alongside' }}</span><span class="legend-unit">{{ zh ? '美元 / 百万 tokens · 图片、视频以行内单位为准' : 'USD / 1M tokens · media units shown per row' }}</span></div>
          <CatalogGroupSection v-if="searchedGroup" :group="searchedGroup" />
          <div v-else class="state-panel"><Icon name="search" size="lg" /><p>{{ t('modelPlaza.noSearchResult') }}</p><button class="btn btn-secondary" type="button" @click="searchQuery = ''">{{ zh ? '清除搜索' : 'Clear search' }}</button></div>
        </section>
        <aside class="pricing-explanation"><Icon name="infoCircle" size="sm" /><div><strong>{{ zh ? '价格与折扣怎么算？' : 'How are prices compared?' }}</strong><p>{{ zh ? '实付单价 = 渠道单价 × 生效倍率；官方折扣 = 实付单价 ÷ 官方参考价。例：实付 $0.20、官方 $1.00，相当于 2 折，节省 80%。折扣范围涵盖输入、输出及可比阶梯，不包含缓存用量、推理附加倍率或高峰加价。分时优惠以对应时段行为准；分组卡片只汇总有可比参考价的模型。' : 'Your unit price = channel price × effective rate. Paying $0.20 versus $1.00 official means 80% saved. Ranges cover input/output and comparable context tiers, excluding cache usage, reasoning multipliers and peak surcharges. Time discounts appear in their own rows. Group summaries include comparable models only.' }}</p></div></aside>
      </template>
      <div v-else class="state-panel"><Icon name="inbox" size="xl" /><p>{{ t('modelPlaza.empty') }}</p></div>
      <section v-if="descriptionHtml && !loading && !loadFailed" class="catalog-note" v-html="descriptionHtml"></section>
    </main>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import AppLayout from '@/components/layout/AppLayout.vue'
import Icon from '@/components/icons/Icon.vue'
import PlatformIcon from '@/components/common/PlatformIcon.vue'
import CatalogGroupSection from '@/components/modelPlaza/CatalogGroupSection.vue'
import { getModelPlaza, type ModelPlazaGroup, type ModelPlazaResponse } from '@/api/modelPlaza'
import { platformLabel } from '@/utils/platformColors'
import type { GroupPlatform } from '@/types'
import CatalogSavingsBadge from '@/components/modelPlaza/CatalogSavingsBadge.vue'
import { compareCatalogGroup } from '@/components/modelPlaza/catalogComparison'

const { t, locale } = useI18n()
const zh = computed(() => locale.value.startsWith('zh'))
const response = ref<ModelPlazaResponse | null>(null)
const loading = ref(true)
const loadFailed = ref(false)
const selectedPlatform = ref('')
const selectedGroupId = ref<number | null>(null)
const searchQuery = ref('')
let abortController: AbortController | null = null
const groups = computed(() => response.value?.groups ?? [])
const platforms = computed(() => [...new Set(groups.value.map((group) => group.platform).filter(Boolean))])
const activeGroup = computed(() => groups.value.find((group) => group.id === selectedGroupId.value) ?? null)
const searchedGroup = computed<ModelPlazaGroup | null>(() => {
  if (!activeGroup.value) return null
  const query = searchQuery.value.trim().toLocaleLowerCase()
  if (!query) return activeGroup.value
  const models = activeGroup.value.models.filter((model) => model.name.toLocaleLowerCase().includes(query))
  return models.length ? { ...activeGroup.value, models } : null
})
const modelCount = computed(() => new Set(groups.value.flatMap(group => group.models.map(model => model.platform + ':' + model.name))).size)
const descriptionHtml = computed(() => {
  const description = response.value?.description?.trim()
  return description ? DOMPurify.sanitize(marked.parse(description) as string) : ''
})

function effectiveRate(group: ModelPlazaGroup): number {
  return group.user_rate_multiplier ?? group.rate_multiplier
}

function platformGroups(platform: string): ModelPlazaGroup[] {
  return groups.value
    .filter((group) => group.platform === platform)
    .sort((a, b) => effectiveRate(a) - effectiveRate(b) || a.name.localeCompare(b.name))
}

function selectPlatform(platform: string) {
  selectedPlatform.value = platform
  const first = platformGroups(platform)[0]
  selectedGroupId.value = first?.id ?? null
}

async function loadCatalog() {
  abortController?.abort()
  const controller = new AbortController()
  abortController = controller
  loading.value = true
  loadFailed.value = false
  try {
    const data = await getModelPlaza({ signal: controller.signal })
    if (controller.signal.aborted) return
    response.value = data
    const firstPlatform = platforms.value[0] ?? ''
    const platform = platforms.value.includes(selectedPlatform.value) ? selectedPlatform.value : firstPlatform
    selectedPlatform.value = platform
    const available = platformGroups(platform)
    if (!available.some((group) => group.id === selectedGroupId.value)) {
      selectedGroupId.value = available[0]?.id ?? null
    }
  } catch (error) {
    if (!controller.signal.aborted && (error as { name?: string }).name !== 'AbortError') loadFailed.value = true
  } finally {
    if (abortController === controller) loading.value = false
  }
}

onMounted(loadCatalog)
onUnmounted(() => abortController?.abort())
</script>

<style scoped>
.catalog { --cat-ink:#172e2c; --cat-muted:#6b7e7a; --cat-line:#e1eae7; --cat-bg:#fff; --cat-soft:#f5f9f7; --cat-accent:#13866c; width:100%; max-width:1440px; margin:0 auto; color:var(--cat-ink); }
.dark .catalog { --cat-ink:#e2eee9; --cat-muted:#96aaa3; --cat-line:#2a3e38; --cat-bg:#15241f; --cat-soft:#192e26; --cat-accent:#6fd9b5; }
.catalog-hero { display:flex; align-items:center; justify-content:space-between; gap:32px; padding:38px 36px; margin-bottom:26px; border:1px solid var(--cat-line); border-radius:20px; background:linear-gradient(115deg,var(--cat-bg) 30%,var(--cat-soft)); overflow:hidden; }
.eyebrow { display:flex; align-items:center; gap:9px; color:var(--cat-accent); font-size:10px; font-weight:600; letter-spacing:.13em; }
.eyebrow i { width:6px; height:6px; border-radius:50%; background:var(--cat-accent); box-shadow:0 0 0 4px color-mix(in srgb,var(--cat-accent) 8%,transparent); }
.eyebrow > span { color:var(--cat-line); padding:0 3px; }
h1 { margin:16px 0 12px; font-size:clamp(28px,3.4vw,44px); font-weight:650; line-height:1.2; letter-spacing:-.045em; }
h1 > span { color:var(--cat-accent); }
.hero-copy > p { max-width:560px; color:var(--cat-muted); font-size:13px; line-height:1.9; }
.hero-tags { display:flex; flex-wrap:wrap; gap:8px 18px; margin-top:20px; color:var(--cat-muted); font-size:10px; }
.hero-tags span:not(:first-child)::before { content:'✓'; color:var(--cat-accent); margin-right:5px; }
.hero-stats { display:grid; grid-template-columns:repeat(3,1fr); flex-shrink:0; padding:24px 0; }
.hero-stats > div { display:flex; flex-direction:column; align-items:center; gap:8px; padding:0 24px; }
.hero-stats > div + div { border-left:1px solid var(--cat-line); }
.hero-stats strong { font-size:32px; font-weight:500; font-variant-numeric:tabular-nums; letter-spacing:-.05em; }
.hero-stats span { font-size:11px; color:var(--cat-muted); }
.catalog-browser { border:1px solid var(--cat-line); background:var(--cat-bg); border-radius:16px; padding:24px; }
.browser-heading,.pricing-heading { display:flex; align-items:center; justify-content:space-between; gap:16px; }
.section-kicker { display:block; color:var(--cat-muted); font-size:9px; font-weight:600; letter-spacing:.16em; }
h2 { display:flex; align-items:center; flex-wrap:wrap; gap:12px; margin-top:6px; font-size:18px; font-weight:650; letter-spacing:-.02em; }
.refresh-button { display:flex; align-items:center; gap:6px; color:var(--cat-muted); font-size:11px; padding:8px; border-radius:6px; }
.refresh-button:hover { background:var(--cat-soft); color:var(--cat-accent); }
.platform-tabs { display:flex; gap:6px; overflow-x:auto; margin-top:22px; padding:5px; background:var(--cat-soft); border:1px solid var(--cat-line); border-radius:10px; }
.platform-tab { display:flex; align-items:center; justify-content:center; flex:1 0 auto; gap:9px; padding:11px 15px; border:1px solid transparent; border-radius:7px; color:var(--cat-muted); font-size:13px; transition:background .15s,border-color .15s; }
.platform-tab.active { color:var(--cat-accent); background:var(--cat-bg); border-color:var(--cat-line); box-shadow:0 2px 5px #102b2410; font-weight:600; }
.platform-tab small { font-size:10px; opacity:.65; }
.group-heading { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin:24px 0 12px; }
.group-heading h3 { font-size:12px; font-weight:600; }
.group-heading > span { font-size:10px; color:var(--cat-muted); }
.group-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,235px),1fr)); gap:12px; }
.group-card { display:flex; flex-direction:column; min-width:0; text-align:left; padding:17px; border:1px solid var(--cat-line); border-radius:11px; background:var(--cat-bg); transition:border-color .15s,box-shadow .15s; }
.group-card:hover { border-color:var(--cat-accent); }
.group-card.active { border-color:var(--cat-accent); background:color-mix(in srgb,var(--cat-accent) 4%,var(--cat-bg)); box-shadow:0 0 0 1px var(--cat-accent); }
.group-top { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.group-name { font-size:13px; font-weight:650; overflow-wrap:anywhere; }
.selection-mark { display:flex; justify-content:center; align-items:center; width:16px; height:16px; flex-shrink:0; border:1px solid var(--cat-line); border-radius:50%; font-size:10px; }
.active .selection-mark { color:var(--cat-bg); background:var(--cat-accent); border-color:var(--cat-accent); }
.group-description { margin:9px 0 17px; color:var(--cat-muted); font-size:11px; line-height:1.8; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.group-comparison { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-top:auto; }
.group-rate { font-size:14px; font-weight:650; font-variant-numeric:tabular-nums; }
.group-rate small { font-size:10px; font-weight:400; color:var(--cat-muted); }
.group-footer { display:flex; flex-wrap:wrap; gap:8px; padding-top:13px; margin-top:14px; border-top:1px solid var(--cat-line); color:var(--cat-muted); font-size:10px; }
.group-footer span + span { color:var(--cat-accent); }
.catalog-pricing { margin-top:30px; min-width:0; }
.pricing-heading { margin-bottom:15px; }
.model-count { padding:4px 7px; border:1px solid var(--cat-line); border-radius:5px; font-size:10px; font-weight:400; color:var(--cat-muted); }
.search-box { display:flex; align-items:center; gap:8px; width:270px; padding:10px 12px; border:1px solid var(--cat-line); background:var(--cat-bg); color:var(--cat-muted); border-radius:8px; }
.search-box:focus-within { outline:2px solid var(--cat-accent); outline-offset:2px; }
.search-box input { min-width:0; width:100%; background:transparent; border:0; outline:0; color:var(--cat-ink); font-size:12px; }
.pricing-legend { display:flex; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:12px; color:var(--cat-muted); font-size:10px; }
.legend-paid { display:flex; align-items:center; gap:5px; color:var(--cat-accent); font-weight:600; }
.legend-paid i { width:7px; height:7px; background:var(--cat-accent); border-radius:2px; }
.legend-unit { margin-left:auto; }
.catalog-pricing :deep(section.overflow-hidden) { border-color:var(--cat-line); border-radius:12px; box-shadow:none; }
.catalog-pricing :deep(section > header) { background:var(--cat-soft); }
.catalog-pricing :deep(.plaza-pricing-table) { border-radius:0; }
.catalog-pricing :deep(.pz-model) { max-width:230px; overflow-wrap:anywhere; }
.catalog-pricing :deep(.pz-rate) { min-width:140px; }
.pricing-explanation { display:flex; align-items:flex-start; gap:10px; margin-top:18px; padding:17px 19px; background:var(--cat-soft); border:1px solid var(--cat-line); border-radius:10px; color:var(--cat-muted); font-size:11px; line-height:1.9; }
.pricing-explanation > :first-child { flex-shrink:0; margin-top:3px; }
.pricing-explanation strong { color:var(--cat-ink); font-weight:600; }
.pricing-explanation p { margin-top:3px; }
.state-panel { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:60px 20px; border:1px dashed var(--cat-line); border-radius:12px; background:var(--cat-bg); color:var(--cat-muted); font-size:13px; }
.catalog-note { margin-top:18px; padding:20px; border:1px solid var(--cat-line); border-radius:12px; background:var(--cat-bg); font-size:12px; line-height:1.9; overflow-wrap:anywhere; }
.catalog-note :deep(p) { margin-bottom:8px; }
.catalog-note :deep(a) { color:var(--cat-accent); text-decoration:underline; }
.catalog-note :deep(ul),.catalog-note :deep(ol) { padding-left:20px; list-style:revert; }
button:focus-visible { outline:2px solid var(--cat-accent); outline-offset:3px; }
@media (max-width:1100px) { .catalog-hero { padding:28px; } .hero-stats > div { padding:0 15px; } }
@media (max-width:760px) { .catalog-hero { flex-direction:column; align-items:stretch; gap:20px; padding:24px; } .hero-stats { padding:18px 0 0; border-top:1px solid var(--cat-line); } .hero-stats strong { font-size:26px; } .catalog-browser { padding:16px; } .pricing-heading { align-items:stretch; flex-direction:column; } .search-box { width:100%; } .legend-unit { width:100%; margin-left:0; } h2 { font-size:16px; } }
@media (prefers-reduced-motion:reduce) { .platform-tab,.group-card { transition:none; } }
</style>
