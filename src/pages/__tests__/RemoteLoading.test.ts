/**
 * @file src/pages/__tests__/RemoteLoading.test.ts
 * @author Lorin Luo
 * @description Unit tests for RemoteLoading.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import RemoteLoading from '../RemoteLoading.vue'

vi.mock('../remoteLoaders', () => {
  return {
    REMOTE_LOADERS: {
      '/loadtest': () => new Promise(() => {}),
    },
  }
})

const i18nMock = {
  t: (key: string) => {
    return key
  },
}

describe('RemoteLoading.vue', () => {
  it('renders loading spinner', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: RemoteLoading }],
    })
    router.push('/loadtest')
    await router.isReady()

    const wrapper = mount(RemoteLoading, {
      global: {
        plugins: [router],
        config: { globalProperties: { $t: i18nMock.t } },
        provide: { i18n: i18nMock },
      },
    })
    expect(wrapper.find('.spinner').exists()).toBe(true)
    expect(wrapper.find('h2').exists()).toBe(false)
  })

  it('renders error when route is unknown', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: RemoteLoading }],
    })
    router.push('/unknown')
    await router.isReady()

    const wrapper = mount(RemoteLoading, {
      global: {
        plugins: [router],
        config: { globalProperties: { $t: i18nMock.t } },
        provide: { i18n: i18nMock },
      },
    })

    expect(wrapper.find('.spinner').exists()).toBe(false)
    expect(wrapper.find('.error').exists()).toBe(true)
    expect(wrapper.text()).toContain('/unknown')
  })
})
