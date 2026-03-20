<!--
  @file MessageDialog.vue - Simple message dialog with single confirm button
  @author Cooper Wang
  @date 2026-03-13
  @description Extends BaseDialog for displaying informational messages with an OK button
-->
<template>
  <BaseDialog
    v-model="visible"
    v-bind="$attrs"
    :show-footer="false"
    :show-close="true"
    :close-on-click-modal="false"
    body-padding="0"
    dialog-class="message-dialog"
  >
    <!-- Custom header: 14px regular #fff (not bold) -->
    <template #header>
      <span class="message-dialog__title">{{ $attrs.title || '' }}</span>
    </template>

    <div class="message-dialog__body">
      <p v-if="message" class="message-dialog__text">{{ message }}</p>
      <slot />
    </div>

    <template #footer>
      <div class="message-dialog__footer">
        <ElButton class="message-dialog__btn" @click="handleConfirm">
          {{ confirmText || t('common.ok') }}
        </ElButton>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { ElButton } from 'element-plus'
import BaseDialog from './BaseDialog.vue'

defineOptions({ inheritAttrs: false })

// i18n
const i18n = inject<{
  t: (key: string, params?: Record<string, unknown>) => string
} | null>('i18n', null)
const t = (key: string, params?: Record<string, unknown>): string =>
  i18n?.t(key, params) ?? key

const props = withDefaults(defineProps<{
  modelValue: boolean
  message?: string
  confirmText?: string
}>(), {
  message: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

/** @author Cooper Wang */
function handleConfirm() {
  emit('confirm')
  visible.value = false
}
</script>

<style scoped>
/* Header title: 14px regular #fff (override bold from BaseDialog) */
.message-dialog__title {
  font-size: var(--font-size-mini);
  font-family: var(--font-family-regular);
  font-weight: 400;
  color: var(--color-white);
  line-height: 35px;
}

/* Body: 10px padding, centered text */
.message-dialog__body {
  text-align: center;
  padding: var(--spacing-sm-plus);
}

/* Body text: 12px regular, line-height 16px, white on dark bg */
.message-dialog__text {
  font-size: var(--font-size-micro);
  font-family: var(--font-family-regular);
  color: var(--color-white);
  line-height: var(--line-height-base);
  margin: 0;
}

/* Footer: centered OK button */
.message-dialog__footer {
  display: flex;
  justify-content: center;
  padding: 0 var(--spacing-sm-plus) var(--spacing-sm-plus);
}
</style>

<style>
/* Unscoped: targets teleported (appendToBody) dialog */
/* Compound selector: .message-dialog is on the same element as .el-dialog */
.el-dialog.message-dialog {
  width: fit-content !important;
  max-width: 400px;
}

.message-dialog .el-dialog__body,
.message-dialog .el-dialog__footer {
  background-color: var(--default-default);
}

/* OK button: PortalButton Form Button default style (blue #428bca) */
.message-dialog .message-dialog__btn {
  min-width: 90px;
  height: 28px;
  padding: 0 var(--spacing-sm-plus);
  border-radius: var(--radius-sm) !important;
  font-size: var(--font-size-tiny);
  font-family: var(--font-family-regular);
  font-weight: 400;
  background-color: var(--default-primary);
  border-color: var(--default-primary);
  color: var(--color-white);
  box-shadow: none !important;
}

.message-dialog .message-dialog__btn:hover,
.message-dialog .message-dialog__btn:focus {
  background-color: var(--hover-primary);
  border-color: var(--hover-primary);
  color: var(--color-white);
}

.message-dialog .message-dialog__btn:active {
  background-color: var(--pressed-primary);
  border-color: var(--pressed-primary);
}
</style>
