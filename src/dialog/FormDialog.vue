<template>
  <BaseDialog
    v-model="visible"
    v-bind="mergedDialogProps"
    :disabled="disabled"
    :confirm-loading="isSubmitting"
    :close-after-confirm="false"
    :on-confirm="handleConfirm"
    @opened="emit('opened')"
    @closed="emit('closed')"
  >
    <template v-if="$slots.header" #header><slot name="header" /></template>
    <div ref="bodyRef" class="form-dialog__body">
      <FormKit
        :id="effectiveFormId"
        type="form"
        :actions="false"
        :disabled="disabled || isSubmitting"
        v-model="valueProxy"
        @submit="handleSubmit"
      >
        <slot :value="valueProxy" />
      </FormKit>
    </div>
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { FormKit } from '@formkit/vue'
import { getNode } from '@formkit/core'
import BaseDialog from './BaseDialog.vue'

type AnyRecord = Record<string, unknown>
type SubmitHandler = (values: AnyRecord) => void | boolean | Promise<void | boolean>

const FORM_ID_PREFIX = 'portal_form_dialog_'
const DEFAULT_DIALOG_PROPS = {
  title: '',
  width: '640px',
  top: '8vh',
  appendToBody: true,
  destroyOnClose: true,
  closeOnClickModal: false,
  closeOnPressEscape: true,
  showClose: true,
  lockScroll: true,
  showFooter: true,
  showCancel: true,
  showConfirm: true,
  confirmText: undefined,
  cancelText: undefined,
} as const

const props = withDefaults(defineProps<{
  modelValue: boolean
  formValue?: AnyRecord
  formId?: string
  dialogProps?: Record<string, unknown>
  disabled?: boolean
  loading?: boolean
  submitOnEnter?: boolean
  closeAfterSubmit?: boolean
  resetOnOpen?: boolean
  scrollToError?: boolean
  onSubmit?: SubmitHandler
}>(), {
  disabled: false,
  submitOnEnter: true,
  closeAfterSubmit: true,
  resetOnOpen: false,
  scrollToError: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:formValue', value: AnyRecord): void
  (e: 'submit', value: AnyRecord): void
  (e: 'opened'): void
  (e: 'closed'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const valueProxy = computed<AnyRecord>({
  get: () => props.formValue ?? {},
  set: (v) => emit('update:formValue', v),
})

const mergedDialogProps = computed(() => ({ ...DEFAULT_DIALOG_PROPS, ...(props.dialogProps || {}) }))
const internalFormId = ref(`${FORM_ID_PREFIX}${Math.random().toString(36).slice(2)}`)
const effectiveFormId = computed(() => props.formId || internalFormId.value)
const bodyRef = ref<HTMLDivElement | null>(null)
const submitting = ref(false)
const isSubmitting = computed(() => props.loading ?? submitting.value)

function scrollToFirstError() {
  if (!props.scrollToError) return
  const root = bodyRef.value
  const el = root?.querySelector<HTMLElement>('.fk-message, .formkit-message')
  if (!el) return
  try { el.scrollIntoView({ block: 'center', inline: 'nearest' }) } catch {}
  try {
    const field = el.closest<HTMLElement>('.formkit-outer, .formkit-wrapper, .formkit-field, .formkit-input')
    field?.querySelector<HTMLElement>('input, textarea, select, button, [tabindex]')?.focus?.()
  } catch {}
}

async function handleConfirm() {
  const node = getNode(effectiveFormId.value)
  try { node?.submit() } catch {}
  await nextTick()
  const valid = (node as any)?.context?.state?.valid
  if (valid === false) scrollToFirstError()
}

async function handleSubmit(values: AnyRecord) {
  if (submitting.value) return
  emit('submit', values)
  if (!props.onSubmit) {
    if (props.closeAfterSubmit) visible.value = false
    return
  }
  submitting.value = true
  try {
    const res = await props.onSubmit(values)
    if (res === false) return
    if (props.closeAfterSubmit) visible.value = false
  } finally {
    submitting.value = false
  }
}

// Enter 提交已由 BaseDialog 统一处理

watch(() => props.modelValue, async (open) => {
  if (!open || !props.resetOnOpen) return
  await nextTick()
  try { getNode(effectiveFormId.value)?.reset() } catch {}
})
</script>

<style scoped>
.form-dialog__body { width: 100%; }
</style>
