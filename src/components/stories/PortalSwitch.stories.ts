import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import PortalSwitch from '../PortalSwitch.vue'

const meta: Meta<typeof PortalSwitch> = {
  title: 'Components/PortalSwitch',
  component: PortalSwitch,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['small', 'default', 'large'] },
    disabled: { control: 'boolean' },
    leftLabel: { control: 'text' },
    rightLabel: { control: 'text' },
  },
}
export default meta

type Story = StoryObj<typeof PortalSwitch>

export const Default: Story = {
  render: () => ({
    components: { PortalSwitch },
    setup() { const val = ref(false); return { val } },
    template: '<PortalSwitch v-model="val" />',
  }),
}

export const WithLabels: Story = {
  render: () => ({
    components: { PortalSwitch },
    setup() { const val = ref(true); return { val } },
    template: '<PortalSwitch v-model="val" left-label="Off" right-label="On" />',
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { PortalSwitch },
    setup() { const val = ref(true); return { val } },
    template: '<PortalSwitch v-model="val" :disabled="true" left-label="Disabled" />',
  }),
}
