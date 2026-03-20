import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import PortalPaging from '../PortalPaging.vue'

const meta: Meta<typeof PortalPaging> = {
  title: 'Components/PortalPaging',
  component: PortalPaging,
  tags: ['autodocs'],
  argTypes: {
    total: { control: 'number' },
    page: { control: 'number' },
    limit: { control: 'number' },
    disabled: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof PortalPaging>

export const Default: Story = {
  render: () => ({
    components: { PortalPaging },
    setup() {
      const page = ref(0)
      const limit = ref(25)
      return { page, limit }
    },
    template: '<PortalPaging :total="200" v-model:page="page" v-model:limit="limit" />',
  }),
}

export const SmallDataset: Story = {
  render: () => ({
    components: { PortalPaging },
    setup() { const page = ref(0); return { page } },
    template: '<PortalPaging :total="10" v-model:page="page" :limit="25" />',
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { PortalPaging },
    setup() { const page = ref(0); return { page } },
    template: '<PortalPaging :total="100" v-model:page="page" :limit="25" :disabled="true" />',
  }),
}
