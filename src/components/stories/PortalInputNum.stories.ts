import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import PortalInputNum from '../PortalInputNum.vue'

const meta: Meta<typeof PortalInputNum> = {
  title: 'Components/PortalInputNum',
  component: PortalInputNum,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['large', 'default', 'small'] },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    disabled: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof PortalInputNum>

export const Default: Story = {
  render: (args) => ({
    components: { PortalInputNum },
    setup() { const val = ref(5); return { args, val } },
    template: '<PortalInputNum v-bind="args" v-model="val" />',
  }),
}

export const WithRange: Story = {
  args: { min: 0, max: 100, step: 5 },
  render: (args) => ({
    components: { PortalInputNum },
    setup() { const val = ref(50); return { args, val } },
    template: '<PortalInputNum v-bind="args" v-model="val" />',
  }),
}

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => ({
    components: { PortalInputNum },
    setup() { const val = ref(10); return { args, val } },
    template: '<PortalInputNum v-bind="args" v-model="val" />',
  }),
}
