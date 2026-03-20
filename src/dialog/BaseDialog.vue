<template>
  <ElDialog
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
    :class="dialogClass"
    @open="handleOpen"
    @opened="emit('opened')"
    @close="emit('close')"
    @closed="handleClosed"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <div class="base-dialog__body" :style="{ maxHeight: bodyMaxHeight }" @keydown="handleKeydown">
      <slot />
    </div>

    <template v-if="showFooter" #footer>
      <slot name="footer">
        <div class="base-dialog__footer">
          <ElButton v-if="showCancel" @click="handleCancel" :disabled="disabled || isConfirming">
            {{ cancelText || $t('common.cancel') }}
          </ElButton>
          <ElButton
            v-if="showConfirm"
            type="primary"
            @click="handleConfirm"
            :loading="isConfirming"
            :disabled="disabled"
          >
            {{ confirmText || $t('common.ok') }}
          </ElButton>
        </div>
      </slot>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElButton, ElDialog } from 'element-plus'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/button/style/css'

type ConfirmResult = void | boolean
type ConfirmHandler = () => ConfirmResult | Promise<ConfirmResult>

const DEFAULT_WIDTH = '520px'
const DEFAULT_TOP = '10vh'
const DEFAULT_BODY_MAX_HEIGHT = '60vh'

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
  dialogClass?: any
  modalClass?: string
  bodyMaxHeight?: string

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
  width: DEFAULT_WIDTH,
  top: DEFAULT_TOP,
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
  bodyMaxHeight: DEFAULT_BODY_MAX_HEIGHT,
  
  showFooter: true,
  showCancel: true,
  showConfirm: true,
  disabled: false,
  closeAfterConfirm: true,
  confirmLoading: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'open'): void
  (e: 'opened'): void
  (e: 'close'): void
  (e: 'closed'): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const lastActive = ref<HTMLElement | null>(null)
const innerConfirming = ref(false)

const isConfirming = computed(() => props.confirmLoading ?? innerConfirming.value)

function handleOpen() {
  emit('open')
  try {
    lastActive.value = (document.activeElement instanceof HTMLElement) ? document.activeElement : null
  } catch {
    lastActive.value = null
  }
}

function handleClosed() {
  emit('closed')
  try {
    lastActive.value?.focus?.()
  } catch {}
  lastActive.value = null
}

function handleCancel() {
  emit('cancel')
  visible.value = false
}

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

function handleKeydown(e: KeyboardEvent) {
  if (e?.key !== 'Enter') return
  if (props.disabled) return
  const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase?.() || ''
  if (tag === 'textarea' || tag === 'button') return
  handleConfirm()
}
</script>

<style scoped>
.base-dialog__body { overflow: auto; }
.base-dialog__footer { display: flex; justify-content: flex-end; gap: var(--spacing-sm); }
:deep(.el-button){
 padding: var(--spacing-xs) var(--spacing-md);
 height: var(--dashboard-action-btn-height);
 border-radius: var(--radius-lg);
 font-size: var(--font-size-extra-small);
}
:deep(.el-button--primary){
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}
</style>
