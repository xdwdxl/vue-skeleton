/**
 * Vite config for Portal host with Module Federation
 * @author Lorin Luo
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons-ng'
import path from 'node:path'
import flags from './src/config/config.js'

function parseBoolEnv(v) {
  const raw = String(v ?? '').trim().toLowerCase()
  if (!raw) return undefined
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true
  if (['0', 'false', 'no', 'off'].includes(raw)) return false
  return undefined
}

export default defineConfig(async ({ mode }) => {
  const envMf = parseBoolEnv(process.env.VITE_ENABLE_MF)
  const flagMf = typeof flags?.enableModuleFederation === 'boolean' ? flags.enableModuleFederation : true
  const enableMf = typeof envMf === 'boolean' ? envMf : flagMf

  const plugins = [
    vue(),
    createSvgIconsPlugin({
      iconDirs: [path.resolve(process.cwd(), 'src/assets/icons/svg')],
      symbolId: 'icon-[name]',
    }),
  ]

  if (enableMf) {
    try {
      const mod = await import('@module-federation/vite')
      const federation = mod.federation
      plugins.push(federation({
        name: 'portal',
        filename: 'remoteEntry.js',
        manifest: true,
        dts: false,
        exposes: {
          './bootstrap': './src/main.ts',
          './runtime': './src/runtime.ts',
          './theme': './src/theme/index.ts',
          './styles': './src/styles/variables.css',
          './http': './src/http/api.ts',
          './api': './src/api/index.ts',
          './i18n': './src/i18n/index.ts',
          './storage': './src/storage/index.ts',
          './error': './src/error/index.ts',
          './audit': './src/audit/client.ts',
          './regionalization': './src/regionalization/index.ts',
          './gantt': './src/gantt/index.ts',
          './dialog': './src/dialog/index.ts',
          './BaseDialog': './src/dialog/BaseDialog.vue',
          './FormDialog': './src/dialog/FormDialog.vue',
          './PortalIcon': './src/components/PortalIcon.vue',
          './PortalTable': './src/components/PortalTable.vue',
          './PortalTableColumn': './src/components/PortalTableColumn.ts',
          './notify': './src/notify/index.ts',
          './dashboard-styles': './src/styles/dashboard.css'
        },
        shared: {
          vue: { singleton: true, requiredVersion: '^3.5.18' },
          'vue-router': { singleton: true, requiredVersion: false }
        }
      }))
    } catch (e) {
      throw new Error('Module federation enabled but @module-federation/vite is not installed. Install it, or disable by setting VITE_ENABLE_MF=false or src/config/config.js enableModuleFederation=false.')
    }
  }

  return {
    base: '',
    plugins,
    resolve: {
      alias: [
        { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
        ...((mode === 'test' || process.env.VITEST === 'true') ? [
          { find: /^dashboardApp\/Dashboard$/, replacement: fileURLToPath(new URL('./src/pages/Home.vue', import.meta.url)) },
        ] : []),
      ],
    },
    server: {
      host: true,
      port: 5000,
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Origin,Accept',
      },
      proxy: {
        '/mcs': {
          target: process.env.VITE_MCS_PROXY_TARGET || 'https://mcs.zijieapi.com',
          changeOrigin: true,
          secure: true,
          ws: false,
          rewrite: (path) => path.replace(/^\/mcs/, '')
        }
      }
    },
    build: {
      modulePreload: false,
      target: 'esnext',
      minify: false,
      cssCodeSplit: true
    },
    preview: {
      host: true,
      port: 5000,
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Origin,Accept',
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/{theme,http,i18n,storage,error,audit,regionalization,cache,bus,api}/**/*.{ts,vue}'],
        exclude: ['src/**/*.d.ts', 'src/**/types.ts', 'src/main.ts', 'src/App.vue', 'src/router/**', 'src/pages/**'],
      },
    }
  }
})
