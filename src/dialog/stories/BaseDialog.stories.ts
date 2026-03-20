import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import BaseDialog from '../BaseDialog.vue'

const meta: Meta<typeof BaseDialog> = {
  title: 'Dialog/BaseDialog',
  component: BaseDialog,
  tags: ['autodocs'],
  argTypes: {
    width: { control: 'text' },
    draggable: { control: 'boolean' },
    showFooter: { control: 'boolean' },
    showCancel: { control: 'boolean' },
    showConfirm: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof BaseDialog>

export const Default: Story = {
  render: () => ({
    components: { BaseDialog },
    setup() { const visible = ref(false); return { visible } },
    template: `
      <div>
        <button @click="visible = true">Open Dialog</button>
        <BaseDialog v-model="visible" title="Base Dialog" width="500px">
          <p>Dialog body content goes here.</p>
        </BaseDialog>
      </div>
    `,
  }),
}

export const WithCustomFooter: Story = {
  render: () => ({
    components: { BaseDialog },
    setup() { const visible = ref(false); return { visible } },
    template: `
      <div>
        <button @click="visible = true">Open Dialog</button>
        <BaseDialog v-model="visible" title="Custom Footer" :show-footer="false">
          <p>Custom content</p>
          <template #footer>
            <div style="display:flex;justify-content:center;padding:10px;">
              <button @click="visible = false">Custom Close</button>
            </div>
          </template>
        </BaseDialog>
      </div>
    `,
  }),
}

export const Draggable: Story = {
  render: () => ({
    components: { BaseDialog },
    setup() { const visible = ref(false); return { visible } },
    template: `
      <div>
        <button @click="visible = true">Open Draggable Dialog</button>
        <BaseDialog v-model="visible" title="Draggable" :draggable="true">
          <p>You can drag this dialog by its header.</p>
        </BaseDialog>
      </div>
    `,
  }),
}
