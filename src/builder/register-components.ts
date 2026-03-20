/**
 * @file Builder.io Component Registration
 * @description Registers all Portal components with Builder.io for visual editing.
 *              Import this file in your app entry point to enable Builder.io integration.
 *
 * Usage:
 *   import '@/builder/register-components'
 *
 * Each component is registered with its name, description, and input definitions
 * so Builder.io's visual editor can render and configure them.
 */
import { RegisteredComponent } from '@builder.io/sdk-vue'

export const BUILDER_API_KEY = '82452ca62b0b4b5995e0a60a1ee0f809'

export const portalComponents: RegisteredComponent[] = [
  // ── PortalButton ──
  {
    component: () => import('@/components/PortalButton.vue'),
    name: 'PortalButton',
    inputs: [
      { name: 'type', type: 'string', enum: ['form', 'square'], defaultValue: 'form' },
      {
        name: 'color',
        type: 'string',
        enum: ['primary', 'default', 'dark', 'white', 'success', 'info', 'danger', 'warning'],
        defaultValue: 'primary',
      },
      { name: 'size', type: 'string', enum: ['sm', 'md', 'lg'], defaultValue: 'md' },
      { name: 'disabled', type: 'boolean', defaultValue: false },
      { name: 'loading', type: 'boolean', defaultValue: false },
    ],
  },

  // ── PortalCard ──
  {
    component: () => import('@/components/PortalCard.vue'),
    name: 'PortalCard',
    inputs: [
      { name: 'title', type: 'string', defaultValue: 'Card Title' },
      {
        name: 'buttonType',
        type: 'string',
        enum: ['actions', 'form', 'downLoad'],
        defaultValue: 'actions',
      },
      { name: 'showHeader', type: 'boolean', defaultValue: true },
      { name: 'showFooter', type: 'boolean', defaultValue: true },
      { name: 'showView', type: 'boolean', defaultValue: false },
      { name: 'showAdd', type: 'boolean', defaultValue: false },
      { name: 'showEdit', type: 'boolean', defaultValue: false },
      { name: 'showDelete', type: 'boolean', defaultValue: false },
      { name: 'showCancel', type: 'boolean', defaultValue: true },
      { name: 'showSave', type: 'boolean', defaultValue: true },
    ],
  },

  // ── PortalInput ──
  {
    component: () => import('@/components/PortalInput.vue'),
    name: 'PortalInput',
    inputs: [
      {
        name: 'type',
        type: 'string',
        enum: ['text', 'textarea', 'password'],
        defaultValue: 'text',
      },
      { name: 'placeholder', type: 'string', defaultValue: '' },
      { name: 'clearable', type: 'boolean', defaultValue: false },
      { name: 'bordered', type: 'boolean', defaultValue: true },
      { name: 'disabled', type: 'boolean', defaultValue: false },
      { name: 'readonly', type: 'boolean', defaultValue: false },
      { name: 'size', type: 'string', enum: ['large', 'default', 'small'], defaultValue: 'small' },
      { name: 'maxlength', type: 'number', defaultValue: 1000 },
      { name: 'showWordLimit', type: 'boolean', defaultValue: false },
      { name: 'showPassword', type: 'boolean', defaultValue: false },
    ],
  },

  // ── PortalInputNum ──
  {
    component: () => import('@/components/PortalInputNum.vue'),
    name: 'PortalInputNum',
    inputs: [
      { name: 'min', type: 'number', defaultValue: 1 },
      { name: 'max', type: 'number', defaultValue: 1000 },
      { name: 'step', type: 'number', defaultValue: 1 },
      { name: 'size', type: 'string', enum: ['large', 'default', 'small'], defaultValue: 'small' },
      { name: 'disabled', type: 'boolean', defaultValue: false },
      { name: 'controls', type: 'boolean', defaultValue: true },
      { name: 'controlsPosition', type: 'string', enum: ['', 'right'], defaultValue: 'right' },
    ],
  },

  // ── PortalSelect ──
  {
    component: () => import('@/components/PortalSelect.vue'),
    name: 'PortalSelect',
    inputs: [
      { name: 'placeholder', type: 'string', defaultValue: '' },
      { name: 'multiple', type: 'boolean', defaultValue: false },
      { name: 'filterable', type: 'boolean', defaultValue: false },
      { name: 'clearable', type: 'boolean', defaultValue: false },
      { name: 'disabled', type: 'boolean', defaultValue: false },
      { name: 'size', type: 'string', enum: ['large', 'default', 'small'], defaultValue: 'small' },
      { name: 'grouped', type: 'boolean', defaultValue: false },
    ],
  },

  // ── PortalSearch ──
  {
    component: () => import('@/components/PortalSearch.vue'),
    name: 'PortalSearch',
    inputs: [
      {
        name: 'variant',
        type: 'string',
        enum: ['underline', 'append', 'button'],
        defaultValue: 'button',
      },
      { name: 'placeholder', type: 'string', defaultValue: '' },
      { name: 'showClear', type: 'boolean', defaultValue: true },
      { name: 'width', type: 'string', defaultValue: '300px' },
      { name: 'disabled', type: 'boolean', defaultValue: false },
    ],
  },

  // ── PortalCheckbox ──
  {
    component: () => import('@/components/PortalCheckbox.vue'),
    name: 'PortalCheckbox',
    inputs: [
      { name: 'disabled', type: 'boolean', defaultValue: false },
      { name: 'isButton', type: 'boolean', defaultValue: false },
      { name: 'border', type: 'boolean', defaultValue: false },
      {
        name: 'size',
        type: 'string',
        enum: ['large', 'default', 'small'],
        defaultValue: 'default',
      },
    ],
  },

  // ── PortalRadio ──
  {
    component: () => import('@/components/PortalRadio.vue'),
    name: 'PortalRadio',
    inputs: [
      { name: 'disabled', type: 'boolean', defaultValue: false },
      { name: 'isButton', type: 'boolean', defaultValue: false },
      { name: 'border', type: 'boolean', defaultValue: false },
      {
        name: 'size',
        type: 'string',
        enum: ['large', 'default', 'small'],
        defaultValue: 'default',
      },
    ],
  },

  // ── PortalSwitch ──
  {
    component: () => import('@/components/PortalSwitch.vue'),
    name: 'PortalSwitch',
    inputs: [
      { name: 'leftLabel', type: 'string', defaultValue: '' },
      { name: 'rightLabel', type: 'string', defaultValue: '' },
      { name: 'disabled', type: 'boolean', defaultValue: false },
      { name: 'size', type: 'string', enum: ['small', 'default', 'large'], defaultValue: 'small' },
    ],
  },

  // ── PortalTable ──
  {
    component: () => import('@/components/PortalTable.vue'),
    name: 'PortalTable',
    inputs: [
      { name: 'pagination', type: 'boolean', defaultValue: false },
      { name: 'page', type: 'number', defaultValue: 1 },
      { name: 'pageSize', type: 'number', defaultValue: 10 },
      { name: 'total', type: 'number', defaultValue: 0 },
    ],
  },

  // ── PortalTabs ──
  {
    component: () => import('@/components/PortalTabs.vue'),
    name: 'PortalTabs',
    inputs: [
      { name: 'tabType', type: 'string', enum: ['page', 'section'], defaultValue: 'page' },
      { name: 'showContent', type: 'boolean', defaultValue: true },
    ],
  },

  // ── PortalAlerts ──
  {
    component: () => import('@/components/PortalAlerts.vue'),
    name: 'PortalAlerts',
    inputs: [
      { name: 'title', type: 'string', defaultValue: '' },
      {
        name: 'type',
        type: 'string',
        enum: ['success', 'warning', 'info', 'error'],
        defaultValue: 'info',
      },
      { name: 'description', type: 'string', defaultValue: '' },
      { name: 'closable', type: 'boolean', defaultValue: true },
      { name: 'showIcon', type: 'boolean', defaultValue: false },
      { name: 'effect', type: 'string', enum: ['light', 'dark'], defaultValue: 'light' },
    ],
  },

  // ── PortalForm ──
  {
    component: () => import('@/components/PortalForm.vue'),
    name: 'PortalForm',
    inputs: [
      {
        name: 'labelPosition',
        type: 'string',
        enum: ['left', 'right', 'top'],
        defaultValue: 'left',
      },
      { name: 'inline', type: 'boolean', defaultValue: false },
      { name: 'disabled', type: 'boolean', defaultValue: false },
      { name: 'maxWidth', type: 'string', defaultValue: '600px' },
    ],
  },

  // ── PortalProgressBars ──
  {
    component: () => import('@/components/PortalProgressBars.vue'),
    name: 'PortalProgressBars',
    inputs: [
      {
        name: 'type',
        type: 'string',
        enum: ['slider', 'bar', 'steps', 'circle'],
        defaultValue: 'bar',
      },
      { name: 'percentage', type: 'number', defaultValue: 0 },
      {
        name: 'status',
        type: 'string',
        enum: ['', 'success', 'exception', 'warning'],
        defaultValue: '',
      },
      { name: 'strokeWidth', type: 'number', defaultValue: 6 },
    ],
  },

  // ── PortalStep ──
  {
    component: () => import('@/components/PortalStep.vue'),
    name: 'PortalStep',
    inputs: [],
  },

  // ── PortalToolTip ──
  {
    component: () => import('@/components/PortalToolTip.vue'),
    name: 'PortalToolTip',
    inputs: [
      { name: 'content', type: 'string', defaultValue: '' },
      {
        name: 'placement',
        type: 'string',
        enum: ['top', 'bottom', 'left', 'right'],
        defaultValue: 'top',
      },
      { name: 'effect', type: 'string', enum: ['dark', 'light'], defaultValue: 'dark' },
      { name: 'trigger', type: 'string', enum: ['hover', 'click', 'focus'], defaultValue: 'hover' },
      { name: 'disabled', type: 'boolean', defaultValue: false },
    ],
  },

  // ── PortalPage ──
  {
    component: () => import('@/components/PortalPage.vue'),
    name: 'PortalPage',
    inputs: [
      { name: 'background', type: 'string', defaultValue: '' },
      { name: 'padding', type: 'string', defaultValue: '' },
      { name: 'bordered', type: 'boolean', defaultValue: false },
      { name: 'shadow', type: 'boolean', defaultValue: false },
      { name: 'loading', type: 'boolean', defaultValue: false },
      { name: 'fullHeight', type: 'boolean', defaultValue: true },
      { name: 'direction', type: 'string', enum: ['', 'row', 'column'], defaultValue: '' },
    ],
  },

  // ── PortalDatePicker ──
  {
    component: () => import('@/components/PortalDatePicker.vue'),
    name: 'PortalDatePicker',
    inputs: [
      {
        name: 'type',
        type: 'string',
        enum: ['date', 'daterange', 'datetime', 'month', 'year', 'week'],
        defaultValue: 'date',
      },
      { name: 'format', type: 'string', defaultValue: 'YYYY-MM-DD' },
      { name: 'disabled', type: 'boolean', defaultValue: false },
      { name: 'clearable', type: 'boolean', defaultValue: false },
      { name: 'size', type: 'string', enum: ['large', 'default', 'small'], defaultValue: 'small' },
    ],
  },

  // ── PortalTree ──
  {
    component: () => import('@/components/PortalTree.vue'),
    name: 'PortalTree',
    inputs: [
      { name: 'defaultExpandAll', type: 'boolean', defaultValue: false },
      { name: 'showCheckbox', type: 'boolean', defaultValue: false },
      { name: 'accordion', type: 'boolean', defaultValue: false },
      { name: 'highlightCurrent', type: 'boolean', defaultValue: false },
      { name: 'maxWidth', type: 'string', defaultValue: '600px' },
    ],
  },

  // ── PortalSpinnerInput ──
  {
    component: () => import('@/components/PortalSpinnerInput.vue'),
    name: 'PortalSpinnerInput',
    inputs: [
      { name: 'min', type: 'number', defaultValue: 0 },
      { name: 'max', type: 'number', defaultValue: 100 },
      { name: 'step', type: 'number', defaultValue: 1 },
      { name: 'disabled', type: 'boolean', defaultValue: false },
    ],
  },

  // ── PortalPaging ──
  {
    component: () => import('@/components/PortalPaging.vue'),
    name: 'PortalPaging',
    inputs: [
      { name: 'total', type: 'number', defaultValue: 0 },
      { name: 'page', type: 'number', defaultValue: 0 },
      { name: 'limit', type: 'number', defaultValue: 25 },
      { name: 'disabled', type: 'boolean', defaultValue: false },
    ],
  },

  // ── PortalTimeSetting ──
  {
    component: () => import('@/components/PortalTimeSetting.vue'),
    name: 'PortalTimeSetting',
    inputs: [{ name: 'disabled', type: 'boolean', defaultValue: false }],
  },
]
