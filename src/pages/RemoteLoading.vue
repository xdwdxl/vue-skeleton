<template>
  <section class="remote-loading">
    <div v-if="loading" class="spinner" role="status" aria-live="polite" aria-label="Loading" />
    <p v-if="error" class="error">{{ error }}</p>
    <component v-if="remote" :is="remote" />
  </section>
</template>

<script setup lang="ts">
import { shallowRef, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../i18n'
import { REMOTE_LOADERS } from './remoteLoaders'

const i18n = useI18n()
const route = useRoute()
const loading = ref(false)
const error = ref('')
const remote = shallowRef<any>(null)

watchEffect(() => {
  const load = REMOTE_LOADERS[String(route.path || '')]
  loading.value = true
  error.value = ''
  if (!load) {
    remote.value = null
    loading.value = false
    error.value = `${i18n.t('remote.unknown_route')}: ${String(route.path || '')}`
    return
  }
  load()
    .then((m) => { remote.value = m?.default || null })
    .catch((e) => {
      error.value = String((e as any)?.message || e || i18n.t('remote.load_error'))
      remote.value = null
    })
    .finally(() => { loading.value = false })
})
</script>

<style scoped>
.remote-loading {
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 44px;
  height: 44px;
  border-radius: 9999px;
  border: 4px solid rgba(0, 0, 0, 0.15);
  border-top-color: var(--color-primary, currentColor);
  color: var(--color-primary, #409eff);
  animation: remote-loading-spin 0.8s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
}

@keyframes remote-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

.error { color: var(--color-danger); }
</style>
