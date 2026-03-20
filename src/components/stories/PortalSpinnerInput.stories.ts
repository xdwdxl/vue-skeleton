import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import PortalSpinnerInput from '../PortalSpinnerInput.vue'

const meta: Meta<typeof PortalSpinnerInput> = {
  title: 'Components/PortalSpinnerInput',
  component: PortalSpinnerInput,
  tags: ['autodocs'],
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    disabled: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof PortalSpinnerInput>

export const Default: Story = {
  render: () => ({
    components: { PortalSpinnerInput },
    setup() { const val = ref(5); return { val } },
    template: '<PortalSpinnerInput v-model="val" :min="0" :max="100" />',
  }),
}

export const WithStep: Story = {
  render: () => ({
    components: { PortalSpinnerInput },
    setup() { const val = ref(10); return { val } },
    template: '<PortalSpinnerInput v-model="val" :min="0" :max="100" :step="5" />',
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { PortalSpinnerInput },
    setup() { const val = ref(3); return { val } },
    template: '<PortalSpinnerInput v-model="val" :disabled="true" />',
  }),
}
