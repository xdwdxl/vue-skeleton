import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '../src/styles/variables-skinLight.css'
import '../src/styles/index.css'

// Provide a minimal i18n so components that inject('i18n') don't crash
const i18nStub = {
  t: (key: string, params?: Record<string, unknown>) => {
    // Return the last segment of the key as a readable fallback
    const label = key.split('.').pop() ?? key
    if (params && 'count' in params) return `${label}: ${params.count}`
    return label
  },
}

setup((app) => {
  app.use(ElementPlus)
  // Add theme class to document for CSS variable resolution
  document.documentElement.classList.add('theme-skinLight')
  // Provide i18n stub globally
  app.provide('i18n', i18nStub)
})

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
}

export default preview
