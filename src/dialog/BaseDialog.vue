<template>
  <ElDialog
    ref="elDialogRef"
    v-model="visible"
    :title="title"
    :width="width"
    :top="top"
    :fullscreen="fullscreen"
    :draggable="draggable"
    :append-to-body="appendToBody"
    :destroy-on-close="destroyOnClose"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :align-center="alignCenter"
    :lock-scroll="lockScroll"
    :z-index="zIndex"
    :modal-class="modalClass"
    :class="['base-dialog', dialogClass]"
    v-bind="$attrs"
    @open="handleOpen"
    @opened="emit('opened')"
    @close="emit('close')"
    @closed="handleClosed"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <div class="base-dialog__body" :style="bodyStyles" @keydown="handleKeydown">
      <slot />
    </div>

    <!-- Always render #footer so child slot overrides work -->
    <template #footer>
      <slot name="footer">
        <div v-if="showFooter" class="base-dialog__footer">
          <ElButton
            v-if="showConfirm"
            type="primary"
            @click="handleConfirm"
            :loading="isConfirming"
            :disabled="disabled"
          >
            {{ confirmText || t('common.save') }}
          </ElButton>
          <ElButton
            v-if="showCancel"
            class="base-dialog__cancel-btn"
            @click="handleCancel"
            :disabled="disabled || isConfirming"
          >
            {{ cancelText || t('common.cancel') }}
          </ElButton>
        </div>
      </slot>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { computed, ref, inject, useAttrs } from 'vue'
import { ElButton, ElDialog } from 'element-plus'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/button/style/css'

defineOptions({ inheritAttrs: false })

const i18n = inject<{
  t: (key: string, params?: Record<string, unknown>) => string
} | null>('i18n', null)
const t = (key: string, params?: Record<string, unknown>): string =>
  i18n?.t(key, params) ?? key

type ConfirmResult = void | boolean
type ConfirmHandler = () => ConfirmResult | Promise<ConfirmResult>

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  width?: string | number
  top?: string
  fullscreen?: boolean
  draggable?: boolean
  appendToBody?: boolean
  destroyOnClose?: boolean
  closeOnClickModal?: boolean
  closeOnPressEscape?: boolean
  showClose?: boolean
  alignCenter?: boolean
  lockScroll?: boolean
  zIndex?: number
  dialogClass?: string | string[]
  modalClass?: string
  bodyMaxHeight?: string
  bodyPadding?: string

  showFooter?: boolean
  showCancel?: boolean
  showConfirm?: boolean
  confirmText?: string
  cancelText?: string
  disabled?: boolean
  closeAfterConfirm?: boolean
  confirmLoading?: boolean
  onConfirm?: ConfirmHandler
}>(), {
  title: '',
  width: '520px',
  top: '10vh',
  fullscreen: false,
  draggable: false,
  appendToBody: true,
  destroyOnClose: true,
  closeOnClickModal: false,
  closeOnPressEscape: true,
  showClose: true,
  alignCenter: false,
  lockScroll: true,
  modalClass: '',
  bodyMaxHeight: '60vh',

  showFooter: true,
  showCancel: true,
  showConfirm: true,
  disabled: false,
  closeAfterConfirm: true,
  confirmLoading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  open: []
  opened: []
  close: []
  closed: []
  confirm: []
  cancel: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const bodyStyles = computed(() => {
  const s: Record<string, string> = {}
  if (props.bodyMaxHeight) s.maxHeight = props.bodyMaxHeight
  if (props.bodyPadding) s.padding = props.bodyPadding
  return s
})

const elDialogRef = ref<InstanceType<typeof ElDialog> | null>(null)
const lastActive = ref<HTMLElement | null>(null)
const innerConfirming = ref(false)

const isConfirming = computed(() => props.confirmLoading ?? innerConfirming.value)

/** @author Cooper Wang */
function handleOpen() {
  emit('open')
  try {
    lastActive.value = (document.activeElement instanceof HTMLElement) ? document.activeElement : null
  } catch {
    lastActive.value = null
  }
}

/** @author Cooper Wang */
function handleClosed() {
  emit('closed')
  try {
    lastActive.value?.focus?.()
  } catch {}
  lastActive.value = null
}

/** @author Cooper Wang */
function handleCancel() {
  emit('cancel')
  visible.value = false
}

/**
 * Execute confirm handler with loading state management
 * @author Cooper Wang
 */
async function handleConfirm() {
  if (isConfirming.value) return
  emit('confirm')

  if (!props.onConfirm) {
    if (props.closeAfterConfirm) visible.value = false
    return
  }

  innerConfirming.value = true
  try {
    const res = await props.onConfirm()
    if (res === false) return
    if (props.closeAfterConfirm) visible.value = false
  } finally {
    innerConfirming.value = false
  }
}

/**
 * Handle Enter key press to trigger confirm action
 * @author Cooper Wang
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleKeydown(e: KeyboardEvent) {
  if (e?.key !== 'Enter') return
  if (props.disabled) return
  const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase?.() || ''
  if (tag === 'textarea' || tag === 'button' || tag === 'select') return
  handleConfirm()
}

defineExpose({
  elRef: elDialogRef,
  resetPosition: () => (elDialogRef.value as any)?.resetPosition?.(),
  handleClose: () => (elDialogRef.value as any)?.handleClose?.(),
})
</script>

<style scoped>
/* Body scroll (scoped - this element is inside the component) */
.base-dialog__body {
  overflow: auto;
}

/* Footer layout (scoped) */
.base-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm-plus);
}
</style>

<style>

/* Dialog panel — compound selector targets same element */
.el-dialog.base-dialog {
  --el-dialog-padding-primary: 0;
  border-radius: var(--radius-base);
  overflow: hidden;
  padding: 0 !important;
  box-shadow: var(--shadow-base);
}

/* Header: 35px, dark #273542 background, white bold text */
.base-dialog .el-dialog__header {
  height: 35px;
  margin: 0;
  padding: 0 var(--spacing-lg-minus);
  background-color: var(--color-secondary);
  display: flex;
  align-items: center;
}

.base-dialog .el-dialog__title {
  font-size: var(--font-size-mini);
  font-family: var(--font-family-bold);
  font-weight: 700;
  color: var(--color-white);
  line-height: 35px;
}

/* Close button: white × icon */
.base-dialog .el-dialog__headerbtn {
  top: 0;
  right: 0;
  width: 35px;
  height: 35px;
}

.base-dialog .el-dialog__headerbtn .el-dialog__close {
  color: var(--color-white);
  font-size: var(--font-size-extra-small);
}

.base-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: var(--color-text-base);
}

/* Body: 20px padding default */
.base-dialog .el-dialog__body {
  padding: var(--spacing-lg-minus);
}

/* Footer: 10px top, 20px sides/bottom */
.base-dialog .el-dialog__footer {
  padding: var(--spacing-sm-plus) var(--spacing-lg-minus) var(--spacing-lg-minus);
}

/* ========== Footer button base styles (all dialog footers) ========== */
.base-dialog .el-dialog__footer .el-button {
  min-width: 90px;
  height: 28px;
  padding: 0 var(--spacing-sm-plus);
  border-radius: var(--radius-sm) !important;
  font-size: var(--font-size-tiny);
  font-family: var(--font-family-regular);
  font-weight: 400;
  box-shadow: none !important;
}

/* Save/Confirm button: primary #428bca */
.base-dialog .el-button--primary {
  background-color: var(--btn-ok-bg);
  border-color: var(--btn-ok-bg);
  color: var(--color-white);
}

.base-dialog .el-button--primary:hover,
.base-dialog .el-button--primary:focus {
  background-color: var(--btn-ok-hover);
  border-color: var(--btn-ok-hover);
  color: var(--color-white);
}

.base-dialog .el-button--primary:active {
  background-color: var(--btn-ok-pressed);
  border-color: var(--btn-ok-pressed);
}

/* Cancel button: dark #445d75 */
.base-dialog .base-dialog__cancel-btn {
  background-color: var(--btn-cancel-bg);
  border-color: var(--btn-cancel-bg);
  color: var(--color-white);
}

.base-dialog .base-dialog__cancel-btn:hover,
.base-dialog .base-dialog__cancel-btn:focus {
  background-color: var(--hover-default);
  border-color: var(--hover-default);
  color: var(--color-white);
}

.base-dialog .base-dialog__cancel-btn:active {
  background-color: var(--pressed-default);
  border-color: var(--pressed-default);
}

/* Disabled button state */
.base-dialog .el-button.is-disabled {
  opacity: 0.5;
}
</style>
