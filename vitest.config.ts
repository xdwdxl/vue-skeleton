import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const federationRemoteStub = () => {
  const VIRTUAL_PREFIX = '\0virtual:federation-remote:';
  const stubbedIds = new Set(['dashboardApp/Dashboard', 'dashboardApp/Helpdesk']);
  return {
    name: 'vitest:federation-remote-stub',
    enforce: 'pre',
    resolveId(id: string) {
      if (!stubbedIds.has(id)) return;
      return `${VIRTUAL_PREFIX}${id}`;
    },
    load(id: string) {
      if (!id.startsWith(VIRTUAL_PREFIX)) return;
      const remoteId = id.slice(VIRTUAL_PREFIX.length);
      return [`import { defineComponent, h } from 'vue'`, `export default defineComponent({`, `  name: ${JSON.stringify(`RemoteStub:${remoteId}`)},`, `  render: () => h('div'),`, `})`].join('\n');
    }
  };
};
export default defineConfig({
  plugins: [federationRemoteStub(), vue()],
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  },
  resolve: {
    alias: [{
      find: '@',
      replacement: fileURLToPath(new URL('./src', import.meta.url))
    }]
  },
  test: {
    coverage: {
      provider: 'v8',
      all: true,
      reporter: ['text', 'html', 'lcov'],
      exclude: ['src/i18n/types.ts', 'src/i18n/index.ts', 'src/config/index.ts']
    },
    projects: [{
      extends: true,
      test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        restoreMocks: true,
        clearMocks: true,
        deps: {
          inline: ['element-plus']
        }
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});