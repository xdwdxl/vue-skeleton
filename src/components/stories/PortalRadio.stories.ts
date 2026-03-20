import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import PortalRadio from '../PortalRadio.vue'

const options = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
  { label: 'Option C', value: 'c' },
  { label: 'Disabled', value: 'd', disabled: true },
]

const meta: Meta<typeof PortalRadio> = {
  title: 'Components/PortalRadio',
  component: PortalRadio,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    isButton: { control: 'boolean' },
    border: { control: 'boolean' },
    size: { control: 'select', options: ['large', 'default', 'small'] },
  },
}
export default meta

type Story = StoryObj<typeof PortalRadio>

export const Default: Story = {
  render: () => ({
    components: { PortalRadio },
    setup() { const val = ref('a'); return { val, options } },
    template: '<PortalRadio v-model="val" :options="options" />',
  }),
}

export const ButtonStyle: Story = {
  render: () => ({
    components: { PortalRadio },
    setup() { const val = ref('a'); return { val, options } },
    template: '<PortalRadio v-model="val" :options="options" :is-button="true" />',
  }),
}

export const WithBorder: Story = {
  render: () => ({
    components: { PortalRadio },
    setup() { const val = ref('a'); return { val, options } },
    template: '<PortalRadio v-model="val" :options="options" :border="true" />',
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { PortalRadio },
    setup() { const val = ref('a'); return { val, options } },
    template: '<PortalRadio v-model="val" :options="options" :disabled="true" />',
  }),
}
