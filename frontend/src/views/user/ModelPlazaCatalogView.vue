<template>
  <AppLayout>
    <main class="mx-auto w-full max-w-[1500px] space-y-6">
      <section class="catalog-hero relative overflow-hidden rounded-3xl border border-primary-200/70 bg-gradient-to-br from-white via-primary-50/80 to-cyan-50/70 px-5 py-4 shadow-sm dark:border-primary-900/50 dark:from-dark-900 dark:via-dark-900 dark:to-primary-950/30 sm:px-6 sm:py-5">
        <div class="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-primary-300/20 blur-3xl dark:bg-primary-500/10"></div>
        <div class="pointer-events-none absolute -bottom-32 right-1/3 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/10"></div>
        <div class="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div class="max-w-3xl">
            <div class="mb-2 inline-flex items-center gap-2 rounded-full border border-primary-200/80 bg-white/70 px-3 py-1 text-xs font-semibold tracking-wide text-primary-700 dark:border-primary-800 dark:bg-dark-800/70 dark:text-primary-300">
              <Icon name="sparkles" size="xs" />
              {{ t('modelPlaza.title') }}
            </div>
            <h1 class="text-3xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-4xl">
              {{ t('modelPlaza.title') }}
            </h1>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-dark-300 sm:text-base">
              {{ t('modelPlaza.description') }}
            </p>
          </div>
          <div class="relative grid grid-cols-3 gap-2 sm:gap-3">
            <div class="catalog-stat">
              <span>{{ t('modelPlaza.filters.platformLabel') }}</span>
              <strong>{{ platforms.length }}</strong>
            </div>
            <div class="catalog-stat">
              <span>{{ t('modelPlaza.filters.groupLabel') }}</span>
              <strong>{{ groups.length }}</strong>
            </div>
            <div class="catalog-stat">
              <span>{{ t('modelPlaza.filters.modelLabel') }}</span>
              <strong>{{ modelCount }}</strong>
            </div>
          </div>
        </div>
      </section>

      <div v-if="loading" class="flex min-h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800">
        <div class="h-9 w-9 animate-spin rounded-full border-2 border-primary-600/25 border-t-primary-600 dark:border-primary-400/25 dark:border-t-primary-400"></div>
      </div>

      <section v-else-if="loadFailed" class="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center dark:border-red-500/30 dark:bg-red-500/10">
        <Icon name="exclamationTriangle" size="lg" class="mx-auto text-red-500" />
        <p class="mt-3 text-sm font-medium text-red-700 dark:text-red-300">{{ t('modelPlaza.loadFailed') }}</p>
        <button class="btn btn-secondary mt-4" type="button" @click="loadCatalog">{{ t('version.retry') }}</button>
      </section>

      <template v-else-if="groups.length">
        <section class="space-y-3" aria-label="Platforms">
          <div class="flex items-end justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-dark-500">01 / {{ t('modelPlaza.filters.platformLabel') }}</p>
              <h2 class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ t('modelPlaza.filters.platformLabel') }}</h2>
            </div>
            <span class="text-xs text-gray-500 dark:text-dark-400">{{ platforms.length }} {{ t('modelPlaza.filters.platformLabel') }}</span>
          </div>
          <div class="flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="platform in platforms"
              :key="platform"
              type="button"
              class="platform-tab"
              :class="selectedPlatform === platform ? 'platform-tab-active' : ''"
              :style="{ '--platform-accent': platformAccentColor(platform) }"
              @click="selectPlatform(platform)"
            >
              <PlatformIcon :platform="platform as GroupPlatform" size="sm" />
              <span>{{ platformLabel(platform) }}</span>
              <span class="platform-count">{{ platformGroups(platform).length }}</span>
            </button>
          </div>
        </section>

        <section class="space-y-3" aria-label="Groups">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-dark-500">02 / {{ t('modelPlaza.filters.groupLabel') }}</p>
              <h2 class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ t('modelPlaza.filters.groupLabel') }}</h2>
            </div>
            <label class="relative w-full sm:w-72">
              <Icon name="search" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input v-model="searchQuery" class="input rounded-xl pl-9" :placeholder="t('modelPlaza.filters.searchPlaceholder')" />
            </label>
          </div>

          <div class="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <button
              v-for="group in platformGroups(selectedPlatform)"
              :key="group.id"
              type="button"
              class="group-card"
              :class="selectedGroupId === group.id ? 'group-card-active' : ''"
              :style="{ '--platform-accent': platformAccentColor(group.platform) }"
              @click="selectedGroupId = group.id"
            >
              <span class="flex min-w-0 items-start justify-between gap-2">
                <span class="min-w-0 text-left">
                  <span class="block truncate text-sm font-semibold text-gray-900 dark:text-white">{{ group.name }}</span>
                  <span class="mt-1 block truncate text-xs leading-5 text-gray-500 dark:text-dark-400" :title="group.description || undefined">{{ group.description || t('modelPlaza.detail.noModels') }}</span>
                </span>
                <span class="shrink-0 rounded-lg bg-white/80 px-2 py-1 font-mono text-xs font-bold text-gray-800 shadow-sm ring-1 ring-gray-200/80 dark:bg-dark-900/70 dark:text-white dark:ring-dark-600">
                  {{ effectiveRate(group) }}x
                </span>
              </span>
              <span class="mt-2 flex items-center justify-between gap-2">
                <span class="flex flex-wrap gap-1.5">
                  <span v-if="group.is_exclusive" class="group-tag group-tag-purple">{{ t('modelPlaza.badges.exclusive') }}</span>
                  <span v-if="group.subscription_type === 'subscription'" class="group-tag group-tag-blue">{{ t('modelPlaza.badges.subscription') }}</span>
                  <span class="group-tag group-tag-gray">{{ group.models.length }} {{ t('modelPlaza.filters.modelLabel') }}</span>
                </span>
                <Icon name="arrowRight" size="sm" class="shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary-600" />
              </span>
            </button>
          </div>
        </section>

        <section v-if="activeGroup" class="catalog-pricing space-y-3">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-dark-500">03 / {{ t('modelPlaza.table.paidPrice') }}</p>
              <h2 class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ activeGroup.name }} · {{ t('modelPlaza.table.paidPrice') }}</h2>
            </div>
            <div class="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 shadow-sm dark:border-dark-700 dark:bg-dark-800 dark:text-dark-400">
              <span class="h-2 w-2 rounded-full bg-primary-500"></span>
              {{ t('modelPlaza.table.paidPrice') }}
              <span class="mx-1 text-gray-300 dark:text-dark-600">/</span>
              <span>{{ t('modelPlaza.table.officialPrice') }}</span>
            </div>
          </div>

          <CatalogGroupSection v-if="searchedGroup" :group="searchedGroup" />
          <div v-else class="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-400">
            {{ t('modelPlaza.noSearchResult') }}
          </div>
        </section>
      </template>

      <section v-else class="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-dark-600 dark:bg-dark-800">
        <Icon name="inbox" size="xl" class="mx-auto text-gray-400" />
        <p class="mt-3 text-sm text-gray-500 dark:text-dark-400">{{ t('modelPlaza.empty') }}</p>
      </section>

      <section v-if="descriptionHtml && !loading && !loadFailed" class="catalog-note rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600 shadow-sm dark:border-dark-700 dark:bg-dark-800/70 dark:text-dark-300" v-html="descriptionHtml"></section>
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
import { platformAccentColor, platformLabel } from '@/utils/platformColors'
import type { GroupPlatform } from '@/types'

const { t } = useI18n()
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
const modelCount = computed(() => groups.value.reduce((total, group) => total + group.models.length, 0))
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
    response.value = await getModelPlaza({ signal: controller.signal })
    const firstPlatform = platforms.value[0] ?? ''
    const platform = platforms.value.includes(selectedPlatform.value) ? selectedPlatform.value : firstPlatform
    selectedPlatform.value = platform
    const available = platformGroups(platform)
    if (!available.some((group) => group.id === selectedGroupId.value)) {
      selectedGroupId.value = available[0]?.id ?? null
    }
  } catch (error) {
    if ((error as { name?: string }).name !== 'AbortError') loadFailed.value = true
  } finally {
    if (abortController === controller) loading.value = false
  }
}

onMounted(loadCatalog)
onUnmounted(() => abortController?.abort())
</script>

<style scoped>
.catalog-hero {
  background-image:
    radial-gradient(ellipse at 86% 0%, rgb(129 140 248 / 16%), transparent 35%),
    radial-gradient(ellipse at 72% 115%, rgb(45 212 191 / 12%), transparent 42%),
    linear-gradient(118deg, #ffffff 0%, #f7f8ff 55%, #f0fdfa 100%) !important;
  border-color: rgb(148 163 184 / 24%) !important;
  box-shadow: 0 20px 54px -42px rgb(15 23 42 / 28%);
}
.dark .catalog-hero {
  background-image:
    radial-gradient(ellipse at 86% 0%, rgb(129 140 248 / 19%), transparent 35%),
    radial-gradient(ellipse at 72% 115%, rgb(45 212 191 / 11%), transparent 42%),
    linear-gradient(118deg, #111827 0%, #172033 55%, #102326 100%) !important;
  border-color: rgb(148 163 184 / 18%) !important;
  box-shadow: 0 24px 70px -38px rgb(15 23 42 / 52%);
}
.catalog-hero::after {
  position: absolute;
  right: 7%;
  bottom: -48%;
  width: min(42vw, 440px);
  aspect-ratio: 1;
  border: 1px solid rgb(99 102 241 / 9%);
  border-radius: 9999px;
  z-index: 0;
  box-shadow: 0 0 0 34px rgb(99 102 241 / 3%), 0 0 0 68px rgb(20 184 166 / 2%);
  content: '';
  pointer-events: none;
}
.catalog-hero h1 {
  background: linear-gradient(105deg, #111827 8%, #4338ca 66%, #0e7490 100%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: none;
  letter-spacing: -.04em;
  font-size: clamp(1.875rem, 3.2vw, 2.75rem);
  line-height: 1.1;
}
.catalog-hero > .relative { z-index: 1; }
.catalog-hero p {
  color: #5b6474;
}
.dark .catalog-hero h1 {
  background-image: linear-gradient(105deg, #ffffff 8%, #c7d2fe 66%, #a5f3fc 100%);
}
.dark .catalog-hero p {
  color: rgb(203 213 225 / 84%);
}
.platform-tab {
  min-height: 46px;
  border-radius: 14px;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}
.platform-tab:focus-visible,
.group-card:focus-visible {
  outline: 3px solid rgb(99 102 241 / 35%);
  outline-offset: 2px;
}
.platform-tab-active {
  transform: translateY(-1px);
}
.catalog-stat {
  @apply min-w-[76px] rounded-2xl border border-white/80 bg-white/75 px-3 py-2.5 text-center shadow-sm backdrop-blur dark:border-dark-700 dark:bg-dark-800/70 sm:min-w-[94px] sm:px-4;
}
.catalog-stat span {
  @apply block text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-dark-400;
}
.catalog-stat strong {
  @apply mt-0.5 block text-xl font-bold tabular-nums text-gray-900 dark:text-white;
}
.platform-tab {
  @apply inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow dark:border-dark-700 dark:bg-dark-800 dark:text-dark-300 dark:hover:border-dark-600;
}
.platform-tab-active {
  color: var(--platform-accent);
  border-color: color-mix(in srgb, var(--platform-accent) 45%, white);
  background: color-mix(in srgb, var(--platform-accent) 9%, white);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--platform-accent) 12%, transparent);
}
.dark .platform-tab-active {
  color: color-mix(in srgb, var(--platform-accent) 65%, white);
  border-color: color-mix(in srgb, var(--platform-accent) 45%, #1e293b);
  background: color-mix(in srgb, var(--platform-accent) 12%, #172334);
}
.platform-count {
  @apply rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-dark-700 dark:text-dark-300;
}
.group-card {
  @apply relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md dark:border-dark-700 dark:from-dark-800 dark:to-dark-800/70 dark:hover:border-dark-600;
}
.group-card::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: linear-gradient(180deg, var(--platform-accent), color-mix(in srgb, var(--platform-accent) 24%, transparent));
  content: '';
  opacity: .65;
  transition: opacity 180ms ease, width 180ms ease;
}
.group-card:hover::before,
.group-card-active::before {
  width: 4px;
  opacity: 1;
}
.group-card-active {
  border-color: color-mix(in srgb, var(--platform-accent) 52%, white);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--platform-accent) 15%, transparent), 0 8px 22px color-mix(in srgb, var(--platform-accent) 10%, transparent);
}
.group-card {
  min-height: 104px;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}
.dark .group-card-active {
  border-color: color-mix(in srgb, var(--platform-accent) 55%, #1e293b);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--platform-accent) 18%, transparent), 0 8px 22px rgba(0, 0, 0, .16);
}
.catalog-pricing :deep(section.overflow-hidden) {
  border-radius: 1.35rem;
  box-shadow: 0 16px 44px -32px rgb(15 23 42 / 45%);
}
.catalog-pricing :deep(section > header) {
  background: linear-gradient(115deg, rgb(248 250 252 / 96%), rgb(255 255 255 / 100%));
}
.dark .catalog-pricing :deep(section > header) {
  background: linear-gradient(115deg, rgb(30 41 59 / 38%), rgb(15 23 42 / 8%));
}
.group-tag {
  @apply inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold;
}
.group-tag-purple { @apply bg-purple-50 text-purple-700 dark:bg-purple-900/25 dark:text-purple-300; }
.group-tag-blue { @apply bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300; }
.group-tag-gray { @apply bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-dark-300; }
.catalog-note { line-height: 1.7; }
.catalog-note :deep(h1), .catalog-note :deep(h2), .catalog-note :deep(h3) { @apply mb-2 mt-3 font-semibold text-gray-900 first:mt-0 dark:text-white; }
.catalog-note :deep(p) { @apply mb-2 last:mb-0; }
.catalog-note :deep(a) { @apply text-primary-600 underline underline-offset-4 dark:text-primary-300; }
.catalog-note :deep(ul) { @apply mb-2 list-disc pl-5; }
.catalog-note :deep(ol) { @apply mb-2 list-decimal pl-5; }
.catalog-hero .catalog-stat {
  min-width: 82px;
  border-color: rgb(255 255 255 / 88%);
  background-color: rgb(255 255 255 / 72%);
  box-shadow: 0 5px 18px rgb(15 23 42 / 4%), inset 0 1px 0 rgb(255 255 255 / 90%);
  backdrop-filter: blur(12px);
}
.catalog-hero .catalog-stat span { color: #6b7280; }
.catalog-hero .catalog-stat strong { color: #111827; font-size: 1.5rem; }
.catalog-hero .catalog-stat:nth-child(1) strong { color: #4f46e5; }
.catalog-hero .catalog-stat:nth-child(2) strong { color: #0891b2; }
.catalog-hero .catalog-stat:nth-child(3) strong { color: #059669; }
.dark .catalog-hero .catalog-stat {
  border-color: rgb(255 255 255 / 12%);
  background-color: rgb(255 255 255 / 6%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 7%);
}
.dark .catalog-hero .catalog-stat span { color: rgb(203 213 225 / 70%); }
.dark .catalog-hero .catalog-stat strong { color: #fff; }
.dark .catalog-hero .catalog-stat:nth-child(1) strong { color: #a5b4fc; }
.dark .catalog-hero .catalog-stat:nth-child(2) strong { color: #67e8f9; }
.dark .catalog-hero .catalog-stat:nth-child(3) strong { color: #6ee7b7; }

@media (prefers-reduced-motion: reduce) {
  .platform-tab,
  .group-card,
  .group-card::before { transition: none; }
}
</style>
