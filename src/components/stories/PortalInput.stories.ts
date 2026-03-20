import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import PortalInput from '../PortalInput.vue'

const meta: Meta<typeof PortalInput> = {
  title: 'Components/PortalInput',
  component: PortalInput,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['text', 'textarea', 'password'] },
    size: { control: 'select', options: ['large', 'default', 'small'] },
    clearable: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    bordered: { control: 'boolean' },
    showPassword: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof PortalInput>

export const Default: Story = {
  render: (args) => ({
    components: { PortalInput },
    setup() {
      const val = ref('')
      return { args, val }
    },
    template: '<PortalInput v-bind="args" v-model="val" placeholder="Enter text..." />',
  }),
}

export const WithClear: Story = {
  render: () => ({
    components: { PortalInput },
    setup() { const val = ref('Clearable text'); return { val } },
    template: '<PortalInput v-model="val" :clearable="true" />',
  }),
}

export const Password: Story = {
  render: () => ({
    components: { PortalInput },
    setup() { const val = ref(''); return { val } },
    template: '<PortalInput v-model="val" type="password" :show-password="true" placeholder="Enter password" />',
  }),
}

export const Textarea: Story = {
  render: () => ({
    components: { PortalInput },
    setup() { const val = ref(''); return { val } },
    template: '<PortalInput v-model="val" type="textarea" :rows="4" placeholder="Enter multi-line text..." />',
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { PortalInput },
    setup() { const val = ref('Disabled input'); return { val } },
    template: '<PortalInput v-model="val" :disabled="true" />',
  }),
}

export const WithWordLimit: Story = {
  render: () => ({
    components: { PortalInput },
    setup() { const val = ref(''); return { val } },
    template: '<PortalInput v-model="val" :maxlength="50" :show-word-limit="true" placeholder="Max 50 chars" />',
  }),
}
