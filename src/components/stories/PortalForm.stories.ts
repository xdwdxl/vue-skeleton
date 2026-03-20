import type { Meta, StoryObj } from '@storybook/vue3'
import { reactive } from 'vue'
import PortalForm from '../PortalForm.vue'
import PortalInput from '../PortalInput.vue'
import PortalButton from '../PortalButton.vue'

const meta: Meta<typeof PortalForm> = {
  title: 'Components/PortalForm',
  component: PortalForm,
  tags: ['autodocs'],
  argTypes: {
    labelPosition: { control: 'select', options: ['left', 'right', 'top'] },
    disabled: { control: 'boolean' },
    inline: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof PortalForm>

export const Default: Story = {
  render: () => ({
    components: { PortalForm, PortalInput, PortalButton },
    setup() {
      const form = reactive({ name: '', email: '' })
      const rules = {
        name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
        email: [{ required: true, message: 'Email is required', trigger: 'blur' }],
      }
      return { form, rules }
    },
    template: `
      <PortalForm :model="form" :rules="rules" label-position="top">
        <el-form-item label="Name" prop="name">
          <PortalInput v-model="form.name" placeholder="Enter name" />
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <PortalInput v-model="form.email" placeholder="Enter email" />
        </el-form-item>
        <template #footer="{ submit, reset }">
          <div style="display: flex; gap: 8px;">
            <PortalButton type="form" color="primary" @click="submit">Submit</PortalButton>
            <PortalButton type="form" color="white" @click="reset">Reset</PortalButton>
          </div>
        </template>
      </PortalForm>
    `,
  }),
}

export const InlineForm: Story = {
  render: () => ({
    components: { PortalForm, PortalInput, PortalButton },
    setup() {
      const form = reactive({ keyword: '', category: '' })
      return { form }
    },
    template: `
      <PortalForm :model="form" :inline="true" label-position="left">
        <el-form-item label="Keyword">
          <PortalInput v-model="form.keyword" placeholder="Search..." />
        </el-form-item>
        <el-form-item label="Category">
          <PortalInput v-model="form.category" placeholder="Category" />
        </el-form-item>
      </PortalForm>
    `,
  }),
}
