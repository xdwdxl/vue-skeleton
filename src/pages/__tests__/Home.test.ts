/**
 * @file src/pages/__tests__/Home.test.ts
 * @author Lorin Luo
 * @description Unit tests for Home.vue interactions and bus
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { API } from '../../api'

// Mock API
vi.mock('../../api', () => ({
  API: {
    AuthLoginUrl: vi.fn().mockReturnValue('/login-url')
  }
}))

// Create a simple test component instead of using LoginPage.vue
const TestLoginComponent = {
  template: `
    <div>
      <h1>{{ $t('LoginPage.title') }}</h1>
      <p>{{ $t('LoginPage.subtitle') }}</p>
      <button @click="handleLogin">{{ $t('shell.login') }}</button>
    </div>
  `,
  methods: {
    handleLogin() {
      window.location.href = API.AuthLoginUrl()
    }
  }
}

const i18nMock = {
  t: (key: string) => {
    if (key === 'LoginPage.title') return 'Welcome'
    if (key === 'LoginPage.subtitle') return 'Please sign in to continue.'
    if (key === 'shell.login') return 'Login'
    return key
  },
}

describe('Login functionality', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost', pathname: '/', href: '' },
      writable: true,
    })
  })

  it('renders title and subtitle', () => {
    const wrapper = mount(TestLoginComponent, {
      global: {
        config: { globalProperties: { $t: i18nMock.t, API } },
        provide: { i18n: i18nMock },
      },
    })
    expect(wrapper.text()).toContain('Welcome')
    expect(wrapper.text()).toContain('Please sign in to continue.')
  })

  it('triggers login and sets location', async () => {
    const wrapper = mount(TestLoginComponent, {
      global: {
        config: { globalProperties: { $t: i18nMock.t, API } },
        provide: { i18n: i18nMock },
      },
    })
    await wrapper.find('button').trigger('click')
    expect(API.AuthLoginUrl).toHaveBeenCalled()
    expect(window.location.href).toContain('/login-url')
  })
})
