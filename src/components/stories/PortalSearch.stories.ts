import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import PortalSearch from '../PortalSearch.vue'

const meta: Meta<typeof PortalSearch> = {
  title: 'Components/PortalSearch',
  component: PortalSearch,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['underline', 'append', 'button'] },
    showClear: { control: 'boolean' },
    disabled: { control: 'boolean' },
    width: { control: 'text' },
  },
}
export default meta

type Story = StoryObj<typeof PortalSearch>

export const ButtonVariant: Story = {
  render: () => ({
    components: { PortalSearch },
    setup() { const val = ref(''); return { val } },
    template: '<PortalSearch v-model="val" variant="button" placeholder="Search..." />',
  }),
}

export const AppendVariant: Story = {
  render: () => ({
    components: { PortalSearch },
    setup() { const val = ref(''); return { val } },
    template: '<PortalSearch v-model="val" variant="append" placeholder="Search..." />',
  }),
}

export const UnderlineVariant: Story = {
  render: () => ({
    components: { PortalSearch },
    setup() { const val = ref(''); return { val } },
    template: '<PortalSearch v-model="val" variant="underline" placeholder="Search..." />',
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { PortalSearch },
    setup() { const val = ref(''); return { val } },
    template: '<PortalSearch v-model="val" :disabled="true" placeholder="Disabled" />',
  }),
}

export const AllVariants: Story = {
  render: () => ({
    components: { PortalSearch },
    setup() { const v1 = ref(''); const v2 = ref(''); const v3 = ref(''); return { v1, v2, v3 } },
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div><strong>Button:</strong> <PortalSearch v-model="v1" variant="button" /></div>
        <div><strong>Append:</strong> <PortalSearch v-model="v2" variant="append" /></div>
        <div><strong>Underline:</strong> <PortalSearch v-model="v3" variant="underline" /></div>
      </div>
    `,
  }),
}
