import type { Meta, StoryObj } from '@storybook/vue3'
import { ref, reactive } from 'vue'
import FormDialog from '../FormDialog.vue'

const meta: Meta<typeof FormDialog> = {
  title: 'Dialog/FormDialog',
  component: FormDialog,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof FormDialog>

export const Default: Story = {
  render: () => ({
    components: { FormDialog },
    setup() {
      const visible = ref(false)
      const formData = reactive({ name: '', email: '' })
      const onSubmit = (values: Record<string, unknown>) => {
        console.log('Form submitted:', values)
        return true
      }
      return { visible, formData, onSubmit }
    },
    template: `
      <div>
        <button @click="visible = true">Open Form Dialog</button>
        <FormDialog v-model="visible" :form-value="formData" :on-submit="onSubmit"
          :dialog-props="{ title: 'Create User', width: '500px' }">
          <template #default="{ value }">
            <div style="display:flex;flex-direction:column;gap:12px;padding:10px 0;">
              <label>Name: <input v-model="formData.name" style="border:1px solid #ccc;padding:4px 8px;" /></label>
              <label>Email: <input v-model="formData.email" style="border:1px solid #ccc;padding:4px 8px;" /></label>
            </div>
          </template>
        </FormDialog>
      </div>
    `,
  }),
}
