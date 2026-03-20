<!--
  @file ListDialog.vue - Dialog with embedded PortalList for data selection
  @author Cooper Wang
  @date 2026-03-13
  @description Extends BaseDialog with PortalList integration for selecting rows with save/cancel actions
-->
<template>
  <BaseDialog
    v-model="visible"
    v-bind="$attrs"
    :show-footer="false"
    dialog-class="list-dialog"
  >
    <div class="list-dialog__body">
      <PortalList
        ref="listRef"
        v-bind="props.listProps"
        @selection-change="handleSelectionChange"
        @row-click="emit('row-click', $event)"
      >
        <template v-for="(_, name) in listSlots" :key="name" #[name]="slotData">
          <slot :name="name" v-bind="slotData || {}" />
        </template>
      </PortalList>
    </div>

    <template #footer>
      <div class="list-dialog__footer">
        <ElButton type="primary" @click="handleSave" :disabled="disabled">
          {{ confirmText || t('common.save') }}
        </ElButton>
        <ElButton class="base-dialog__cancel-btn" @click="handleCancel" :disabled="disabled">
          {{ cancelText || t('common.cancel') }}
        </ElButton>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed, ref, inject, useSlots } from 'vue'
import { ElButton } from 'element-plus'
import BaseDialog from './BaseDialog.vue'
import PortalList from '../components/PortalList.vue'

defineOptions({ inheritAttrs: false })

const i18n = inject<{
  t: (key: string, params?: Record<string, unknown>) => string
} | null>('i18n', null)
const t = (key: string, params?: Record<string, unknown>): string =>
  i18n?.t(key, params) ?? key

const props = withDefaults(defineProps<{
  modelValue: boolean
  confirmText?: string
  cancelText?: string
  disabled?: boolean
  /** All PortalList props passed through via v-bind */
  listProps?: Record<string, unknown>
}>(), {
  disabled: false,
  listProps: () => ({}),
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [rows: any[]]
  cancel: []
  'selection-change': [rows: any[]]
  'row-click': [row: any]
}>()

const slots = useSlots()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const listRef = ref<InstanceType<typeof PortalList> | null>(null)
const selectedRows = ref<any[]>([])

/* Filter out footer slot so it doesn't bleed into PortalList */
const listSlots = computed(() => {
  const { footer, ...rest } = slots
  return rest
})

/**
 * Handle PortalList selection change
 * @author Cooper Wang
 * @param {any[]} rows - Selected row data
 */
function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows
  emit('selection-change', rows)
}

/** @author Cooper Wang */
function handleSave() {
  emit('save', selectedRows.value)
  visible.value = false
}

/** @author Cooper Wang */
function handleCancel() {
  emit('cancel')
  visible.value = false
}

defineExpose({
  listRef,
  selectedRows,
})
</script>

<style scoped>
.list-dialog__body {
  width: 100%;
}

/* Remove header border in dialog context — search row doesn't need wrapping border */
.list-dialog__body :deep(.portal-list__header) {
  border: none;
}

/* Align search/settings flush with table edges */
.list-dialog__body :deep(.portal-list__toolbar) {
  padding-left: 0;
  padding-right: 0;
}

/* Footer: Save + Cancel, right-aligned, 10px gap */
.list-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm-plus);
}
</style>

<!-- Cancel button + footer button styles handled by BaseDialog -->
