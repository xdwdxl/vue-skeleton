<!--
  @file PortalForm.vue - Form component with validation
  @author Vicky Zhu
  @date 2026-03-13
  @description Wraps el-form with custom error highlighting (empty vs invalid) and submit/reset logic
-->
<template>
  <div class="portal-form-container">
    <el-form
      ref="formRef"
      :label-position="labelPosition"
      :style="{ maxWidth: maxWidth }"
      :model="model"
      :rules="rules"
      :label-width="labelWidth"
      :label-suffix="labelSuffix"
      :inline="inline"
      :inline-message="inlineMessage"
      :status-icon="statusIcon"
      :show-message="showMessage"
      :size="size"
      :disabled="disabled"
      :validate-on-rule-change="validateOnRuleChange"
      :hide-required-asterisk="hideRequiredAsterisk"
      :require-asterisk-position="requireAsteriskPosition"
      :scroll-to-error="scrollToError"
      :scroll-into-view-options="scrollIntoViewOptions"
      @validate="onValidate"
    >
      <slot :errorClass="errorClass" />
      <div
        v-if="$slots.footer"
        class="button-box"
      >
        <slot
          name="footer"
          :submit="submitForm"
          :reset="resetForm"
        />
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
  /**
   * @component PortalForm - Form component with validation
   * @author Vicky Zhu
   * @date 2026-03-13
   * @props {Record} model - Form data model (required)
   * @props {FormRules} [rules] - Validation rules
   * @props {string} [labelPosition='left'] - Label position: left, right, top
   * @props {boolean} [inline=false] - Whether to display as inline form
   * @props {boolean} [disabled=false] - Whether to disable all form items
   * @props {boolean} [scrollToError=false] - Whether to scroll to the first error field
   * @emits {Record} submit - Triggered on successful form validation
   * @emits {Record} submitError - Triggered on failed form validation
   * @emits reset - Triggered when form is reset
   * @emits {string, boolean, string} validate - Triggered when a field is validated
   * @slot default - Form items content, receives errorClass function
   * @slot footer - Form footer with submit/reset buttons, receives submit and reset functions
   */

  import { reactive, ref, watch, nextTick } from 'vue'
  import type { FormRules, FormInstance } from 'element-plus'

  interface Props {
    model: Record<string, any>
    rules?: FormRules
    labelPosition?: 'left' | 'right' | 'top'
    labelWidth?: string
    labelSuffix?: string
    maxWidth?: string
    errorFields?: string[]
    inline?: boolean
    inlineMessage?: boolean
    statusIcon?: boolean
    showMessage?: boolean
    size?: 'large' | 'default' | 'small'
    disabled?: boolean
    validateOnRuleChange?: boolean
    hideRequiredAsterisk?: boolean
    requireAsteriskPosition?: 'left' | 'right'
    scrollToError?: boolean
    scrollIntoViewOptions?: Record<string, any> | boolean
  }

  defineOptions({ name: 'PortalForm' })

  const props = withDefaults(defineProps<Props>(), {
    rules: () => ({}),
    labelPosition: 'left',
    labelWidth: 'auto',
    labelSuffix: '',
    maxWidth: '600px',
    errorFields: () => [],
    inline: false,
    inlineMessage: false,
    statusIcon: false,
    showMessage: true,
    disabled: false,
    validateOnRuleChange: true,
    hideRequiredAsterisk: false,
    requireAsteriskPosition: 'left',
    scrollToError: false,
  })

  const emit = defineEmits<{
    submit: [model: Record<string, any>]
    submitError: [fields?: Record<string, any>]
    reset: []
    validate: [prop: string, isValid: boolean, message: string]
  }>()

  const formRef = ref<FormInstance>()
  const fieldErrors = reactive<Record<string, 'empty' | 'invalid' | ''>>({})
  let isResetting = false

  watch(
    () => props.errorFields,
    (fields) => {
      fields.forEach((field) => {
        if (!(field in fieldErrors)) {
          fieldErrors[field] = ''
        }
      })
    },
    { immediate: true },
  )

  watch(
    () => props.errorFields.map((f) => props.model[f]),
    () => {
      if (isResetting) return
      props.errorFields.forEach((field) => updateFieldError(field))
    },
    { deep: true },
  )

  /**
   * Handle el-form validate event and re-emit
   * @author Vicky Zhu
   * @param {string} prop - Field property name
   * @param {boolean} isValid - Whether the field passed validation
   * @param {string} message - Validation error message
   */
  const onValidate = (prop: string, isValid: boolean, message: string) => {
    emit('validate', prop, isValid, message)
  }

  /**
   * Check if a form field value is empty
   * @author Vicky Zhu
   * @param {string} field - Field property name
   * @returns {boolean} - Whether the field is empty
   */
  const isEmpty = (field: string): boolean => {
    const val = props.model[field]
    if (Array.isArray(val)) return val.length === 0
    return val === '' || val === null || val === undefined
  }

  /**
   * Get CSS error class for a form field based on its error state
   * @author Vicky Zhu
   * @param {string} field - Field property name
   * @returns {string} - CSS class name: 'error-empty', 'error-invalid', or ''
   */
  const errorClass = (field: string) => {
    if (!fieldErrors[field]) return ''
    return fieldErrors[field] === 'empty' ? 'error-empty' : 'error-invalid'
  }

  /**
   * Validate a single field and update its error state
   * @author Vicky Zhu
   * @param {string} field - Field property name
   */
  const updateFieldError = (field: string) => {
    formRef.value?.validateField(field, (isValid: boolean) => {
      if (isValid) {
        fieldErrors[field] = ''
      } else {
        fieldErrors[field] = isEmpty(field) ? 'empty' : 'invalid'
      }
    })
  }

  /**
   * Validate and submit the form
   * @author Vicky Zhu
   */
  const submitForm = async () => {
    if (!formRef.value) return
    await formRef.value.validate((valid: boolean, fields?: Record<string, any>) => {
      if (valid) {
        emit('submit', props.model)
      } else {
        Object.keys(fields ?? {}).forEach((field) => {
          fieldErrors[field] = isEmpty(field) ? 'empty' : 'invalid'
        })
        emit('submitError', fields)
      }
    })
  }

  /**
   * Reset the form to initial state and clear all validation
   * @author Vicky Zhu
   */
  const resetForm = async () => {
    if (!formRef.value) return
    isResetting = true
    formRef.value.clearValidate()
    formRef.value.resetFields()
    Object.keys(fieldErrors).forEach((key) => {
      fieldErrors[key] = ''
    })
    await nextTick()
    isResetting = false
    emit('reset')
  }

  defineExpose({
    formRef,
    submitForm,
    resetForm,
    validate: () => formRef.value?.validate(),
    validateField: (field: string) => formRef.value?.validateField(field),
    resetFields: () => formRef.value?.resetFields(),
    clearValidate: (fields?: string[]) => formRef.value?.clearValidate(fields),
  })
</script>

<style lang="scss" scoped>
  .portal-form-container {
    margin: var(--spacing-lg-minus) 0;
    display: flex;

    .button-box {
      margin-top: var(--spacing-3xl);
      width: 415px;
      align-items: flex-end;
    }

    :deep() {
      .el-form-item__error {
        position: absolute;
        background-color: var(--default-default);
        color: var(--color-white);
        font-size: var(--font-size-micro);
        line-height: var(--spacing-md);
        max-width: 200px;
        padding: var(--spacing-xs-plus) var(--spacing-sm-plus);
        border-radius: var(--radius-base);
        border: 1px solid var(--default-default);
        box-shadow: var(--shadow-tooltip);
        z-index: 10;

        &::before {
          content: '';
          position: absolute;
          top: -6px;
          left: var(--spacing-sm-plus);
          border-width: 0 6px 6px 6px;
          border-style: solid;
          border-color: transparent transparent var(--default-default) transparent;
        }
      }

      .el-input__wrapper,
      .el-textarea__inner,
      .el-select__wrapper {
        transition: box-shadow 0.001s ease;
      }

      .error-empty.is-error .el-form-item__content .el-input__wrapper,
      .error-empty.is-error .el-form-item__content .el-textarea__inner,
      .error-empty.is-error .el-form-item__content .el-select__wrapper {
        box-shadow: 0px 0px 4px 1px var(--color-warning) !important;
      }

      .error-invalid.is-error .el-form-item__content .el-input__wrapper,
      .error-invalid.is-error .el-form-item__content .el-textarea__inner,
      .error-invalid.is-error .el-form-item__content .el-select__wrapper {
        box-shadow: 0px 0px 4px 1px var(--color-danger) !important;
      }
    }
  }
</style>
