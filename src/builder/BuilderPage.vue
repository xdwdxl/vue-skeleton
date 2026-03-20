<!--
  @file BuilderPage.vue - Builder.io Content Renderer
  @description Renders Builder.io content for a given model and URL path.
               Used as a route component to display AI-generated pages.

  Usage:
    <BuilderPage model="page" />
    or with router: { path: '/preview/:path(.*)', component: BuilderPage }
-->
<template>
  <div class="builder-page">
    <Content
      v-if="canShowContent"
      :model="model"
      :content="content"
      :api-key="apiKey"
      :custom-components="portalComponents"
    />
    <div v-else-if="isLoading" class="builder-page__loading">
      Loading...
    </div>
    <div v-else class="builder-page__not-found">
      <p>Page not found in Builder.io</p>
      <p>Model: {{ model }} | Path: {{ urlPath }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Content, fetchOneEntry } from '@builder.io/sdk-vue'
import { portalComponents, BUILDER_API_KEY } from './register-components'

const props = withDefaults(defineProps<{
  model?: string
  path?: string
  apiKey?: string
}>(), {
  model: 'page',
  path: '',
  apiKey: BUILDER_API_KEY,
})

const content = ref<any>(null)
const isLoading = ref(true)

const urlPath = computed(() => props.path || window.location.pathname)
const canShowContent = computed(() => content.value && !isLoading.value)

async function loadContent() {
  isLoading.value = true
  try {
    content.value = await fetchOneEntry({
      model: props.model,
      apiKey: props.apiKey,
      userAttributes: {
        urlPath: urlPath.value,
      },
    })
  } catch (e) {
    console.error('[BuilderPage] Failed to fetch content:', e)
    content.value = null
  } finally {
    isLoading.value = false
  }
}

onMounted(loadContent)
watch(() => [props.model, urlPath.value], loadContent)
</script>

<style scoped>
.builder-page {
  width: 100%;
  min-height: 200px;
}

.builder-page__loading,
.builder-page__not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--color-text-default, #666);
  font-size: 14px;
}
</style>
