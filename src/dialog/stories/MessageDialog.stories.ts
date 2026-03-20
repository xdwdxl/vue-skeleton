import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import MessageDialog from '../MessageDialog.vue'

const meta: Meta<typeof MessageDialog> = {
  title: 'Dialog/MessageDialog',
  component: MessageDialog,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof MessageDialog>

export const Default: Story = {
  render: () => ({
    components: { MessageDialog },
    setup() { const visible = ref(false); return { visible } },
    template: `
      <div>
        <button @click="visible = true">Show Message</button>
        <MessageDialog v-model="visible" title="Notice" message="Operation completed successfully!" />
      </div>
    `,
  }),
}

export const CustomConfirmText: Story = {
  render: () => ({
    components: { MessageDialog },
    setup() { const visible = ref(false); return { visible } },
    template: `
      <div>
        <button @click="visible = true">Show Warning</button>
        <MessageDialog v-model="visible" title="Warning" message="Are you sure you want to proceed?" confirm-text="Yes, continue" />
      </div>
    `,
  }),
}
