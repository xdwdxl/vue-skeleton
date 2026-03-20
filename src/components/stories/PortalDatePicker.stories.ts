import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import PortalDatePicker from '../PortalDatePicker.vue'

const meta: Meta<typeof PortalDatePicker> = {
  title: 'Components/PortalDatePicker',
  component: PortalDatePicker,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['date', 'daterange', 'datetime', 'month', 'year', 'week'] },
    size: { control: 'select', options: ['large', 'default', 'small'] },
    disabled: { control: 'boolean' },
    clearable: { control: 'boolean' },
    readonly: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof PortalDatePicker>

export const Default: Story = {
  render: () => ({
    components: { PortalDatePicker },
    setup() { const val = ref(''); return { val } },
    template: '<PortalDatePicker v-model="val" />',
  }),
}

export const DateRange: Story = {
  render: () => ({
    components: { PortalDatePicker },
    setup() { const val = ref([]); return { val } },
    template: '<PortalDatePicker v-model="val" type="daterange" start-placeholder="Start" end-placeholder="End" />',
  }),
}

export const DateTime: Story = {
  render: () => ({
    components: { PortalDatePicker },
    setup() { const val = ref(''); return { val } },
    template: '<PortalDatePicker v-model="val" type="datetime" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" />',
  }),
}

export const MonthPicker: Story = {
  render: () => ({
    components: { PortalDatePicker },
    setup() { const val = ref(''); return { val } },
    template: '<PortalDatePicker v-model="val" type="month" format="YYYY-MM" value-format="YYYY-MM" />',
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { PortalDatePicker },
    setup() { const val = ref('2026-03-19'); return { val } },
    template: '<PortalDatePicker v-model="val" :disabled="true" />',
  }),
}
