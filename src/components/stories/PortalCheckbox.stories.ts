import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import PortalCheckbox from '../PortalCheckbox.vue'

const options = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Disabled', value: 'disabled', disabled: true },
]

const meta: Meta<typeof PortalCheckbox> = {
  title: 'Components/PortalCheckbox',
  component: PortalCheckbox,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    isButton: { control: 'boolean' },
    border: { control: 'boolean' },
    size: { control: 'select', options: ['large', 'default', 'small'] },
  },
}
export default meta

type Story = StoryObj<typeof PortalCheckbox>

export const Default: Story = {
  render: () => ({
    components: { PortalCheckbox },
    setup() { const val = ref(['apple']); return { val, options } },
    template: '<PortalCheckbox v-model="val" :options="options" />',
  }),
}

export const ButtonStyle: Story = {
  render: () => ({
    components: { PortalCheckbox },
    setup() { const val = ref(['apple']); return { val, options } },
    template: '<PortalCheckbox v-model="val" :options="options" :is-button="true" />',
  }),
}

export const WithBorder: Story = {
  render: () => ({
    components: { PortalCheckbox },
    setup() { const val = ref([]); return { val, options } },
    template: '<PortalCheckbox v-model="val" :options="options" :border="true" />',
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { PortalCheckbox },
    setup() { const val = ref(['apple']); return { val, options } },
    template: '<PortalCheckbox v-model="val" :options="options" :disabled="true" />',
  }),
}
