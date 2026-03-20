<!--
  @file PortalSwitch.vue - Switch toggle component
  @author Vicky Zhu
  @date 2026-03-13
  @description Wraps el-switch with optional left and right labels
-->
<template>
  <div class="portal-switch-container">
    <span
      class="portal-switch__label"
      v-if="leftLabel"
    >
      {{ leftLabel }}
    </span>
    <el-switch
      v-model="model"
      :size="size"
      :disabled="disabled"
      :active-value="activeValue"
      :inactive-value="inactiveValue"
      :width="width"
      @change="change"
    />
    <span
      class="portal-switch__label"
      v-if="rightLabel"
    >
      {{ rightLabel }}
    </span>
  </div>
</template>

<script setup lang="ts">
  /**
   * @component PortalSwitch - Switch toggle component
   * @author Vicky Zhu
   * @date 2026-03-13
   * @props {SwitchSize} [size='small'] - Switch size
   * @props {boolean} [disabled=false] - Whether the switch is disabled
   * @props {string} leftLabel - Label text on the left side
   * @props {string} rightLabel - Label text on the right side
   * @props {string|number|boolean} [activeValue=true] - Value when switch is on
   * @props {string|number|boolean} [inactiveValue=false] - Value when switch is off
   * @emits {string|number|boolean} change - Triggered when switch value changes
   */

  type SwitchSize = 'small' | 'default' | 'large'

  interface Props {
    size?: SwitchSize
    disabled?: boolean
    leftLabel?: string
    rightLabel?: string
    activeValue?: string | number | boolean
    inactiveValue?: string | number | boolean
    width?: number | string
  }

  defineOptions({ name: 'PortalSwitch' })

  const model = defineModel<string | number | boolean>({ default: false })

  withDefaults(defineProps<Props>(), {
    size: 'small',
    disabled: false,
    leftLabel: '',
    rightLabel: '',
    activeValue: true,
    inactiveValue: false,
    width: undefined,
  })

  const emit = defineEmits<{
    change: [value: string | number | boolean]
  }>()

  /**
   * Handle switch value change
   * @author Vicky Zhu
   * @param {string|number|boolean} val - New switch value
   */
  const change = (val: string | number | boolean) => {
    emit('change', val)
  }
</script>

<style lang="scss" scoped>
  .portal-switch-container {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    &__label {
      font-size: var(--font-size-micro);
      font-weight: 400;
      color: var(--color-secondary);
    }

    :deep(.el-switch) {
      --el-switch-on-color: var(--switch-on-color);
      --el-switch-off-color: var(--switch-off-color);
      height: 26px;

      .el-switch__core {
        border-radius: var(--radius-base);
        height: 14px;
        min-width: 26px;

        .el-switch__action {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--color-primary);
        }
      }

      .el-switch__label {
        font-size: var(--font-size-micro);
        font-weight: 400;
        color: var(--color-secondary);

        &.is-active {
          color: var(--color-secondary);
        }
      }
    }
  }
</style>
