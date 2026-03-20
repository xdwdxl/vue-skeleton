<!--
  @file PortalAlerts.vue - Alert notification component
  @author Vicky Zhu
  @date 2026-03-13
  @description Wraps el-alert with preset styles for success, warning, info, and error types
-->
<template>
  <div class="portal-alert-container">
    <el-alert
      :title="title"
      :type="type"
      :description="description"
      :closable="closable"
      :center="center"
      :close-text="closeText"
      :show-icon="showIcon"
      :effect="effect"
      :class="`portal-alert--${type}`"
      @close="$emit('close')"
    >
      <template
        v-if="$slots.default"
        #default
      >
        <slot />
      </template>
      <template
        v-if="$slots.title"
        #title
      >
        <slot name="title" />
      </template>
      <template
        v-if="$slots.icon"
        #icon
      >
        <slot name="icon" />
      </template>
    </el-alert>
  </div>
</template>

<script setup lang="ts">
  /**
   * @component PortalAlerts - Alert notification component
   * @author Vicky Zhu
   * @date 2026-03-13
   * @props {string} title - Alert title text
   * @props {AlertType} [type='info'] - Alert type: success, warning, info, error
   * @props {string} description - Descriptive text below the title
   * @props {boolean} [closable=true] - Whether the alert can be closed
   * @props {boolean} [center=false] - Whether to center the text
   * @props {string} closeText - Custom close button text
   * @props {boolean} [showIcon=false] - Whether to show the type icon
   * @props {AlertEffect} [effect='light'] - Theme style: light or dark
   * @emits close - Triggered when the alert is closed
   * @slot default - Custom alert content
   * @slot title - Custom title content
   * @slot icon - Custom icon content
   */

  type AlertType = 'success' | 'warning' | 'info' | 'error'
  type AlertEffect = 'light' | 'dark'

  interface Props {
    title?: string
    type?: AlertType
    description?: string
    closable?: boolean
    center?: boolean
    closeText?: string
    showIcon?: boolean
    effect?: AlertEffect
  }

  defineOptions({ name: 'PortalAlerts' })

  withDefaults(defineProps<Props>(), {
    title: '',
    type: 'info',
    description: '',
    closable: true,
    center: false,
    closeText: '',
    showIcon: false,
    effect: 'light',
  })

  defineEmits<{
    (e: 'close'): void
  }>()
</script>

<style lang="scss" scoped>
  .portal-alert-container {
    display: flex;
    align-items: center;
    border-radius: var(--radius-base);
    font-size: var(--font-size-mini);
    line-height: var(--line-height-base);

    :deep(.el-alert) {
      .el-alert__title {
        font-weight: bold;
      }

      &.portal-alert--warning {
        color: var(--pressed-warning);
        background-color: var(--color-background-warning);

        .el-alert__title {
          color: var(--pressed-warning);
        }
      }

      &.portal-alert--success {
        color: var(--pressed-success);
        background-color: var(--color-background-success);

        .el-alert__title {
          color: var(--pressed-success);
        }
      }

      &.portal-alert--info {
        color: var(--color-text-title);
        background-color: var(--color-background-base);

        .el-alert__title {
          color: var(--color-text-title);
        }
      }

      &.portal-alert--error {
        color: var(--pressed-danger);
        background-color: var(--color-background-danger);

        .el-alert__title {
          color: var(--pressed-danger);
        }
      }
    }
  }
</style>
