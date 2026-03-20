import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

const federationRemoteStub = () => {
  const VIRTUAL_PREFIX = '\0virtual:federation-remote:'
  const stubbedIds = new Set(['dashboardApp/Dashboard', 'dashboardApp/Helpdesk'])

  return {
    name: 'vitest:federation-remote-stub',
    enforce: 'pre',
    resolveId(id: string) {
      if (!stubbedIds.has(id)) return
      return `${VIRTUAL_PREFIX}${id}`
    },
    load(id: string) {
      if (!id.startsWith(VIRTUAL_PREFIX)) return
      const remoteId = id.slice(VIRTUAL_PREFIX.length)
      return [
        `import { defineComponent, h } from 'vue'`,
        `export default defineComponent({`,
        `  name: ${JSON.stringify(`RemoteStub:${remoteId}`)},`,
        `  render: () => h('div'),`,
        `})`,
      ].join('\n')
    },
  }
}

const cssStub = () => ({
  name: 'vitest:css-stub',
  enforce: 'pre' as const,
  transform(_code: string, id: string) {
    if (id.endsWith('.css')) return 'export default {}'
  },
})

export default defineConfig({
  plugins: [cssStub(), federationRemoteStub(), vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    restoreMocks: true,
    clearMocks: true,
    deps: {
      inline: ['element-plus'],
    },
    coverage: {
      provider: 'v8',
      all: true,
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'src/i18n/types.ts',
        'src/i18n/index.ts',
        'src/config/index.ts',
      ],
    },
  },
})
