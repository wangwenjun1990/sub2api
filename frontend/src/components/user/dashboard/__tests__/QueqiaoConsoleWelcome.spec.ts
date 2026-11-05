import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it, vi } from 'vitest'
import en from '@/i18n/locales/en/dashboard'
import zh from '@/i18n/locales/zh/dashboard'
import QueqiaoConsoleWelcome from '../QueqiaoConsoleWelcome.vue'

// Match the production Vite flag: runtime messages use the CSP-safe JIT compiler.
vi.hoisted(() => vi.stubGlobal('__INTLIFY_JIT_COMPILATION__', true))

describe('console welcome localization', () => {
  it('renders English and updates all copy when the locale changes', async () => {
    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, zh } })
    const wrapper = mount(QueqiaoConsoleWelcome, { global: { plugins: [i18n] } })

    expect(wrapper.get('h2').text()).toBe('Give great ideas room to grow.')
    expect(wrapper.get('h2 span').text()).toBe('room to grow.')
    expect(wrapper.text()).not.toMatch(/[\u3400-\u9fff]/u)
    expect(wrapper.get('.qq-welcome-description').text()).toBe(en.dashboard.consoleWelcome.description)

    i18n.global.locale.value = 'zh'
    await nextTick()
    expect(wrapper.get('h2').text()).toBe('让好想法，继续发生。')
    expect(wrapper.get('h2 span').text()).toBe('继续发生。')
    expect(wrapper.get('.qq-welcome-description').text()).toBe(zh.dashboard.consoleWelcome.description)
    expect(wrapper.get('section').attributes('aria-labelledby')).toBe(wrapper.get('h2').attributes('id'))

    wrapper.unmount()
  })
})
