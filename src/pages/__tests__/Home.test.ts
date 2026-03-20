/**
 * @file src/pages/__tests__/Home.test.ts
 * @author Lorin Luo
 * @description Unit tests for Home.vue interactions and bus
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Landing from '../Landing.vue'
import { API } from '../../api'

vi.mock('element-plus/es/components/button/style/css', () => ({}))
vi.mock('element-plus/es/components/card/style/css', () => ({}))

const i18nMock = {
  t: (key: string) => {
    if (key === 'landing.title') return 'Welcome'
    if (key === 'landing.subtitle') return 'Please sign in to continue.'
    if (key === 'shell.login') return 'Login'
    return key
  },
}

describe('Landing.vue', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost', pathname: '/', href: '' },
      writable: true,
    })
    vi.spyOn(API, 'AuthLoginUrl').mockReturnValue('/login-url')
  })

  it('renders title and subtitle', () => {
    const wrapper = mount(Landing, {
      global: {
        config: { globalProperties: { $t: i18nMock.t } },
        provide: { i18n: i18nMock },
        stubs: {
          ElButton: { template: '<button class="el-button" @click="$emit(\'click\')"><slot /></button>' },
          CidsCard: { props: ['title', 'subtitle'], template: '<div><div class="cids-card-title">{{ title }}</div><div class="cids-card-subtitle">{{ subtitle }}</div><slot /></div>' },
        },
      },
    })
    expect(wrapper.text()).toContain('Welcome')
    expect(wrapper.text()).toContain('Please sign in to continue.')
  })

  it('triggers login and sets location', async () => {
    const wrapper = mount(Landing, {
      global: {
        config: { globalProperties: { $t: i18nMock.t } },
        provide: { i18n: i18nMock },
        stubs: {
          ElButton: { template: '<button class="el-button" @click="$emit(\'click\')"><slot /></button>' },
          CidsCard: { props: ['title', 'subtitle'], template: '<div><div class="cids-card-title">{{ title }}</div><div class="cids-card-subtitle">{{ subtitle }}</div><slot /></div>' },
        },
      },
    })
    await wrapper.find('button.el-button').trigger('click')
    expect(API.AuthLoginUrl).toHaveBeenCalled()
    expect(window.location.href).toContain('/login-url')
  })
})
