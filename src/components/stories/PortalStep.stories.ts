import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import PortalStep from '../PortalStep.vue'

const steps = [
  { id: 'info', label: 'Basic Info' },
  { id: 'address', label: 'Address' },
  { id: 'payment', label: 'Payment' },
  { id: 'confirm', label: 'Confirm' },
]

const meta: Meta<typeof PortalStep> = {
  title: 'Components/PortalStep',
  component: PortalStep,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof PortalStep>

export const Default: Story = {
  render: () => ({
    components: { PortalStep },
    setup() { const active = ref('info'); return { active, steps } },
    template: '<PortalStep v-model="active" :steps="steps" />',
  }),
}

export const SecondStep: Story = {
  render: () => ({
    components: { PortalStep },
    setup() { const active = ref('address'); return { active, steps } },
    template: '<PortalStep v-model="active" :steps="steps" />',
  }),
}

export const LastStep: Story = {
  render: () => ({
    components: { PortalStep },
    setup() { const active = ref('confirm'); return { active, steps } },
    template: '<PortalStep v-model="active" :steps="steps" />',
  }),
}
