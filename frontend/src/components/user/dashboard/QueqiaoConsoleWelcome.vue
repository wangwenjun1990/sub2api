<template>
  <section class="qq-welcome" aria-labelledby="qq-welcome-title">
    <div class="qq-welcome-copy">
      <p class="qq-eyebrow"><span aria-hidden="true"></span> {{ t('dashboard.consoleWelcome.eyebrow') }}</p>
      <i18n-t id="qq-welcome-title" keypath="dashboard.consoleWelcome.title" tag="h2" scope="global">
        <template #accent><span>{{ t('dashboard.consoleWelcome.accent') }}</span></template>
      </i18n-t>
      <p class="qq-welcome-description">{{ t('dashboard.consoleWelcome.description') }}</p>
    </div>
    <svg class="qq-welcome-art" viewBox="0 0 360 160" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="qq-arch-face" x1="150" y1="25" x2="220" y2="150" gradientUnits="userSpaceOnUse">
          <stop stop-color="var(--qq-art-bright)" /><stop offset="1" stop-color="var(--qq-art-dim)" />
        </linearGradient>
      </defs>
      <ellipse cx="204" cy="91" rx="137" ry="38" stroke="currentColor" opacity=".25" transform="rotate(-18 204 91)" />
      <ellipse cx="204" cy="91" rx="155" ry="53" stroke="currentColor" opacity=".12" transform="rotate(-18 204 91)" />
      <path d="M166 133V76a40 40 0 0 1 80 0v57h-17V76a23 23 0 0 0-46 0v57z" fill="url(#qq-arch-face)" />
      <path d="m166 133-17-10V66a40 40 0 0 1 61-34l16 10" fill="var(--qq-art-dim)" opacity=".65" />
      <path d="M171 133V76a35 35 0 0 1 70 0v57m-65 0V76a30 30 0 0 1 60 0v57" stroke="var(--qq-art-line)" opacity=".6" />
      <path d="m269 23 3 10 10 3-10 3-3 10-3-10-10-3 10-3z" fill="var(--qq-lime)" />
      <circle cx="87" cy="116" r="4" fill="var(--qq-lime)" />
      <circle cx="314" cy="77" r="2" fill="currentColor" />
      <path d="M120 34v8m-4-4h8M289 128v8m-4-4h8" stroke="currentColor" opacity=".6" />
    </svg>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
