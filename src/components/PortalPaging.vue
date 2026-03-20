<!--
  @file PortalPaging.vue - Compact pagination control
  @author Cooper Wang
  @date 2026-03-13
  @description Custom pagination bar with first/prev/next/last navigation, page input, page-size selector, and refresh
-->
<template>
  <div
    v-show="!hidden"
    class="portal-paging"
    v-bind="$attrs"
  >
    <!-- First -->
    <button
      class="portal-paging__btn"
      :disabled="disabled || isFirst"
      :title="t('paging.first_page')"
      @click="goTo(0)"
    >
      <el-icon><DArrowLeft /></el-icon>
    </button>

    <!-- Previous -->
    <button
      class="portal-paging__btn"
      :disabled="disabled || isFirst"
      :title="t('paging.previous_page')"
      @click="goTo(currentPage - 1)"
    >
      <el-icon><ArrowLeft /></el-icon>
    </button>

    <!-- Page input -->
    <div class="portal-paging__info">
      <input
        class="portal-paging__input"
        type="text"
        :style="{ width: inputWidth }"
        :disabled="disabled"
        :value="currentPage + 1"
        @keyup.enter="handlePageInput($event)"
        @blur="handlePageInput($event)"
      />
      <span>/</span>
      <span>{{ totalPages }}</span>
    </div>

    <!-- Next -->
    <button
      class="portal-paging__btn"
      :disabled="disabled || isLast"
      :title="t('paging.next_page')"
      @click="goTo(currentPage + 1)"
    >
      <el-icon><ArrowRight /></el-icon>
    </button>

    <!-- Last -->
    <button
      class="portal-paging__btn"
      :disabled="disabled || isLast"
      :title="t('paging.last_page')"
      @click="goTo(totalPages - 1)"
    >
      <el-icon><DArrowRight /></el-icon>
    </button>

    <span class="portal-paging__divider" />

    <!-- Page size -->
    <div
      class="portal-paging__size-wrap"
      :style="{ width: sizeWidth }"
    >
      <select
        class="portal-paging__size"
        :value="limit"
        :disabled="disabled"
        :title="t('paging.items_per_page')"
        @change="handleSizeChange(($event.target as HTMLSelectElement).value)"
      >
        <option
          v-for="s in pageSizes"
          :key="s"
          :value="s"
        >
          {{ s }}
        </option>
      </select>
      <div class="portal-paging__size-arrow">
        <el-icon><ArrowDown /></el-icon>
      </div>
    </div>

    <!-- Refresh -->
    <button
      class="portal-paging__btn"
      :disabled="disabled"
      :title="t('common.refresh')"
      @click="emit('refresh')"
    >
      <!-- @slot refresh - Custom refresh button icon -->
      <slot name="refresh">
        <el-icon><Refresh /></el-icon>
      </slot>
    </button>

    <span class="portal-paging__divider" />

    <!-- Total -->
    <!-- @slot total - Custom total display, receives { total, currentPage, totalPages } -->
    <slot
      name="total"
      :total="total"
      :current-page="currentPage"
      :total-pages="totalPages"
    >
      <span class="portal-paging__total">{{ t('common.total', { count: total }) }}</span>
    </slot>
  </div>
</template>

<script setup lang="ts">
  /**
   * @component PortalPaging - Compact pagination control
   * @author Cooper Wang
   * @date 2026-03-13
   * @props {number} total - Total item count
   * @props {number} [page=0] - Current page index (0-based)
   * @props {number} [limit=25] - Items per page
   * @props {number[]} [pageSizes] - Available page size options
   * @props {boolean} [hidden=false] - Whether to hide the component
   * @props {boolean} [disabled=false] - Whether to disable all controls
   * @props {string} [inputWidth='50px'] - Page input field width
   * @props {string} [sizeWidth='60px'] - Page size selector width
   * @emits {number} update:page - Page index changed
   * @emits {number} update:limit - Page size changed
   * @emits {{ page, limit }} pagination - Page or size changed
   * @emits refresh - Refresh button clicked
   * @slot total - Custom total display, receives { total, currentPage, totalPages }
   * @slot refresh - Custom refresh button icon
   */
  import { computed } from 'vue'
  import {
    ArrowLeft,
    ArrowRight,
    DArrowLeft,
    DArrowRight,
    Refresh,
    ArrowDown,
  } from '@element-plus/icons-vue'
  import { useI18n } from '@/i18n'
  import '@/styles/portal-paging.css'

  defineOptions({ name: 'PortalPaging', inheritAttrs: false })

  const { t } = useI18n()

  interface Props {
    total: number
    page?: number
    limit?: number
    pageSizes?: number[]
    hidden?: boolean
    disabled?: boolean
    inputWidth?: string
    sizeWidth?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    page: 0,
    limit: 25,
    pageSizes: () => [25, 50, 100, 200],
    hidden: false,
    disabled: false,
    inputWidth: '50px',
    sizeWidth: '60px',
  })

  const emit = defineEmits<{
    'update:page': [value: number]
    'update:limit': [value: number]
    pagination: [value: { page: number; limit: number }]
    refresh: []
  }>()

  const currentPage = computed(() => props.page)
  const totalPages = computed(() => Math.ceil(props.total / props.limit) || 1)
  const isFirst = computed(() => currentPage.value <= 0)
  const isLast = computed(() => currentPage.value >= totalPages.value - 1)

  /**
   * Navigate to a specific page with bounds clamping
   * @author Cooper Wang
   * @param {number} page - Target page index (0-based)
   */
  const goTo = (page: number) => {
    const clamped = Math.max(0, Math.min(page, totalPages.value - 1))
    if (clamped === currentPage.value) return
    emit('update:page', clamped)
    emit('pagination', { page: clamped, limit: props.limit })
  }

  /**
   * Parse page number from input and navigate
   * @author Cooper Wang
   * @param {Event} e - Input event from page number field
   */
  const handlePageInput = (e: Event) => {
    const raw = parseInt((e.target as HTMLInputElement).value)
    const page = isNaN(raw) || raw < 1 ? 0 : Math.min(raw, totalPages.value) - 1
    ;(e.target as HTMLInputElement).value = String(page + 1)
    goTo(page)
  }

  /**
   * Handle page size change and reset to first page
   * @author Cooper Wang
   * @param {string} val - New page size value from select element
   */
  const handleSizeChange = (val: string) => {
    const size = Number(val)
    emit('update:limit', size)
    emit('update:page', 0)
    emit('pagination', { page: 0, limit: size })
  }

  defineExpose({
    currentPage,
    totalPages,
    goTo,
  })
</script>
