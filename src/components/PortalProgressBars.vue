<!--
  @file PortalProgressBars.vue - Progress bar component
  @author Vicky Zhu
  @date 2026-03-13
  @description Wraps el-progress with four display modes: slider, bar, steps, circle
-->
<template>
  <div
    class="portal-progress-container"
    :class="`portal-progress-container--${type}`"
  >
    <!-- Slider -->
    <template v-if="type === 'slider'">
      <el-progress
        :percentage="percentage"
        :show-text="showText"
        :stroke-width="strokeWidth"
        :color="color"
        :text-inside="textInside"
        :status="status || undefined"
        :indeterminate="indeterminate"
        :duration="duration"
        :stroke-linecap="strokeLinecap"
        :format="format"
        :striped="striped"
        :striped-flow="stripedFlow"
        v-bind="$attrs"
      >
        <template
          v-if="$slots.default"
          #default
        >
          <slot />
        </template>
      </el-progress>
    </template>

    <!-- Bar with floating label -->
    <template v-else-if="type === 'bar'">
      <div
        class="portal-progress__label"
        :style="{ left: `${percentage}%` }"
      >
        {{ percentage }}%
      </div>
      <el-progress
        :percentage="percentage"
        :show-text="false"
        :stroke-width="strokeWidth"
        :color="color"
        :text-inside="textInside"
        :status="status || undefined"
        :indeterminate="indeterminate"
        :duration="duration"
        :stroke-linecap="strokeLinecap"
        :format="format"
        :striped="striped"
        :striped-flow="stripedFlow"
        v-bind="$attrs"
      >
        <template
          v-if="$slots.default"
          #default
        >
          <slot />
        </template>
      </el-progress>
    </template>

    <!-- Steps -->
    <template v-else-if="type === 'steps'">
      <div class="portal-progress__steps">
        <div
          v-for="(step, index) in steps"
          :key="step"
          class="portal-progress__step"
          :class="{ active: index < currentStep, completed: index < currentStep - 1 }"
        >
          <div class="portal-progress__step-circle">{{ step }}</div>
          <div
            v-if="index < steps.length - 1"
            class="portal-progress__step-line"
          ></div>
        </div>
      </div>
    </template>

    <!-- Circle -->
    <template v-else-if="type === 'circle'">
      <el-progress
        type="circle"
        :percentage="percentage"
        :color="color"
        :stroke-width="strokeWidth"
        :width="width"
        :show-text="showText"
        :status="status || undefined"
        :indeterminate="indeterminate"
        :duration="duration"
        :stroke-linecap="strokeLinecap"
        :format="format"
        :striped="striped"
        :striped-flow="stripedFlow"
        v-bind="$attrs"
      >
        <template
          v-if="$slots.default"
          #default
        >
          <slot />
        </template>
      </el-progress>
    </template>
  </div>
</template>

<script setup lang="ts">
  /**
   * @component PortalProgressBars - Progress bar component with multiple display modes
   * @author Vicky Zhu
   * @date 2026-03-13
   * @props {string} type - Display mode: slider, bar, steps, circle
   * @props {number} percentage - Current progress percentage (required)
   * @props {number[]} steps - Step labels for steps mode
   * @props {number} currentStep - Active step index for steps mode
   * @props {ProgressColor} color - Custom color for progress bar (string/function/array)
   * @props {number} strokeWidth - Progress bar stroke width
   * @props {boolean} textInside - Show text inside progress bar (only for type='line')
   * @props {string} status - Progress bar status: success, exception, warning
   * @props {boolean} indeterminate - Enable indeterminate animation
   * @props {number} duration - Animation duration for indeterminate and striped-flow
   * @props {number} width - Circle/dashboard progress bar width
   * @props {boolean} showText - Whether to show progress text
   * @props {string} strokeLinecap - Shape of progress bar endpoints: butt, round, square
   * @props {Function} format - Custom text format function
   * @props {boolean} striped - Enable striped style
   * @props {boolean} stripedFlow - Enable striped flow animation
   * @emits {number} update:percentage - Emitted when percentage changes
   * @emits {number} update:currentStep - Emitted when current step changes
   */

  type ProgressStatus = '' | 'success' | 'exception' | 'warning'
  type StrokeLinecap = 'butt' | 'round' | 'square'
  type ProgressColor =
    | string
    | ((percentage: number) => string)
    | { color: string; percentage: number }[]

  interface Props {
    type?: 'slider' | 'bar' | 'steps' | 'circle'
    percentage?: number
    steps?: number[]
    currentStep?: number
    color?: ProgressColor
    strokeWidth?: number
    textInside?: boolean
    status?: ProgressStatus
    indeterminate?: boolean
    duration?: number
    width?: number
    showText?: boolean
    strokeLinecap?: StrokeLinecap
    format?: (percentage: number) => string
    striped?: boolean
    stripedFlow?: boolean
  }

  defineOptions({ name: 'PortalProgressBars' })

  const props = withDefaults(defineProps<Props>(), {
    type: 'bar',
    percentage: 0,
    steps: () => [1, 2, 3, 4],
    currentStep: 2,
    color: '',
    strokeWidth: 6,
    textInside: false,
    status: '',
    indeterminate: false,
    duration: 3,
    width: 126,
    showText: true,
    strokeLinecap: 'round',
    striped: false,
    stripedFlow: false,
  })

  const emit = defineEmits<{
    'update:percentage': [value: number]
    'update:currentStep': [value: number]
  }>()
</script>

<style lang="scss" scoped>
  .portal-progress-container {
    width: 100%;

    // Slider mode
    &--slider {
      :deep() {
        .el-progress-bar {
          padding-right: 0;
        }

        .el-progress-bar__outer {
          height: 6px !important;
          background-color: var(--color-white);
          border: 1px solid var(--color-border-base);
          border-radius: var(--radius-sm);
          overflow: visible;
        }

        .el-progress-bar__inner {
          height: 100%;
          background-color: var(--color-white);
          border-radius: var(--radius-sm);

          &::after {
            content: '';
            position: absolute;
            right: -8px;
            top: 50%;
            transform: translateY(-50%);
            width: 16px;
            height: 16px;
            background-color: var(--color-white);
            border: 2px solid var(--color-border-base);
            border-radius: var(--radius-circle);
            box-sizing: border-box;
          }
        }
      }
    }

    // Bar mode
    &--bar {
      position: relative;
      padding-top: 28px;

      .portal-progress__label {
        position: absolute;
        top: 0;
        transform: translateX(-50%);
        background-color: var(--color-primary);
        color: var(--color-white);
        padding: 2px 8px;
        border-radius: var(--radius-base);
        font-size: var(--font-size-micro);
        white-space: nowrap;
        z-index: 1;

        &::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 5px 5px 0 5px;
          border-style: solid;
          border-color: var(--color-primary) transparent transparent transparent;
        }
      }

      :deep() {
        .el-progress-bar {
          padding-right: 0;
        }

        .el-progress-bar__outer {
          height: 4px !important;
          background-color: var(--color-border-light);
          border-radius: var(--radius-base);
          overflow: visible;
        }

        .el-progress-bar__inner {
          height: 8px;
          top: -2px;
          position: relative;
          background-color: var(--color-text-primary);
          border-radius: var(--radius-base);
        }
      }
    }

    // Steps mode
    &--steps {
      .portal-progress__steps {
        display: flex;
        align-items: center;
        width: 100%;
      }

      .portal-progress__step {
        display: flex;
        align-items: center;
        flex: 1;

        &-circle {
          width: var(--size-xxl);
          height: var(--size-xxl);
          border-radius: var(--radius-circle);
          background-color: var(--color-text-default);
          color: var(--color-white);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-micro);
          font-weight: bold;
          z-index: 2;
        }

        &-line {
          flex: 1;
          height: 11px;
          background-color: var(--color-white);
          border: 1px solid var(--color-border-light);
          margin: 0 -12px;
          z-index: 1;
        }

        &.active,
        &.completed {
          .portal-progress__step-circle {
            background-color: var(--color-secondary);
            color: var(--color-white);
          }

          .portal-progress__step-line {
            background-color: var(--color-secondary);
          }
        }
      }
    }
  }
</style>
