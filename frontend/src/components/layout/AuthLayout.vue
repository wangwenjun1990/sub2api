<template>
  <div class="qq-public-shell qq-auth-shell relative flex min-h-screen items-center justify-center overflow-hidden p-4">
    <!-- Background -->
    <div
      class="qq-public-backdrop absolute inset-0 bg-gradient-to-br from-gray-50 via-primary-50/30 to-gray-100 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950"
    ></div>

    <!-- Decorative Grid -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="qq-public-grid absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"
      ></div>
    </div>

    <div class="qq-auth-frame relative z-10">
      <section class="qq-auth-content">
        <div class="qq-auth-brand text-center">
          <template v-if="settingsLoaded">
            <div class="qq-auth-logo mb-4 inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl shadow-lg shadow-primary-500/30">
              <img :src="siteLogo || '/logo.svg'" alt="Logo" class="h-full w-full object-contain" />
            </div>
            <h1 class="text-gradient mb-2 text-3xl font-bold">{{ siteName }}</h1>
            <p class="qq-auth-subtitle text-sm text-gray-500 dark:text-dark-400">{{ siteSubtitle }}</p>
          </template>
        </div>

        <div class="qq-auth-card card-glass rounded-2xl p-8 shadow-glass">
          <slot />
        </div>

        <div class="qq-auth-footer mt-6 text-center text-sm"><slot name="footer" /></div>
        <div class="qq-auth-copyright mt-8 text-center text-xs text-gray-400 dark:text-dark-500">
          &copy; {{ currentYear }} {{ siteName }}. All rights reserved.
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/styles/queqiao-public.css'
import { computed, onMounted } from 'vue'
import { useAppStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'

const appStore = useAppStore()

const siteName = computed(() => {
  const configuredName = appStore.siteName?.trim()
  return !configuredName || /^sub2api$/i.test(configuredName) ? '鹊桥AI' : configuredName
})
const siteLogo = computed(() => sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || '连接模型，也连接你的下一种可能。')
const settingsLoaded = computed(() => appStore.publicSettingsLoaded)

const currentYear = computed(() => new Date().getFullYear())

onMounted(() => {
  appStore.fetchPublicSettings()
})
</script>

<style scoped>
.text-gradient {
  @apply bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent;
}
</style>
