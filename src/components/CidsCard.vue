<template>
  <ElCard
    class="cids-card"
    :shadow="shadow"
    :body-style="bodyStyle"
  >
    <template v-if="showHeader" #header>
      <div class="cids-card__header" :class="{ 'is-dividerless': !headerDivider }">
        <div class="cids-card__header-left">
          <slot name="title">
            <div v-if="title" class="cids-card__title">{{ title }}</div>
          </slot>
          <div v-if="subtitle" class="cids-card__subtitle">{{ subtitle }}</div>
        </div>
        <div v-if="$slots.actions" class="cids-card__header-right">
          <slot name="actions" />
        </div>
      </div>
    </template>
    <slot />
  </ElCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElCard } from 'element-plus'
import 'element-plus/es/components/card/style/css'

const DEFAULT_BODY_PADDING = 'var(--spacing-md)'
const DEFAULT_SHADOW = 'never'

const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  shadow?: 'always' | 'hover' | 'never'
  bodyPadding?: string
  headerDivider?: boolean
}>(), {
  title: '',
  subtitle: '',
  shadow: DEFAULT_SHADOW,
  bodyPadding: DEFAULT_BODY_PADDING,
  headerDivider: true,
})

const showHeader = computed(() => Boolean(props.title || props.subtitle))

const bodyStyle = computed(() => {
  return { padding: props.bodyPadding }
})
</script>

<style scoped>
.cids-card {
  border-radius: var(--radius-lg);
  border-color: var(--el-border-color);
}

.cids-card :deep(.el-card__header) {
  padding: var(--spacing-sm) var(--spacing-md);
}

.cids-card :deep(.el-card__body) {
  padding: var(--spacing-md);
}

.cids-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  width: 100%;
}

.cids-card__header.is-dividerless {
  border-bottom: none;
}

.cids-card__header-left {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  min-width: 0;
}

.cids-card__title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--el-color-primary);
  line-height: var(--line-height-base);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cids-card__subtitle {
  font-size: var(--font-size-small);
  color: var(--el-text-color-secondary);
  line-height: var(--line-height-base);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cids-card__header-right {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
}
</style>

