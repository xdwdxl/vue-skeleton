import type { Meta, StoryObj } from '@storybook/vue3'
import PortalTable from '../PortalTable.vue'

const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
  { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'Editor', status: 'Inactive' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'User', status: 'Active' },
  { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', role: 'Admin', status: 'Active' },
]

const columns = [
  { prop: 'id', label: 'ID', width: 60 },
  { prop: 'name', label: 'Name', minWidth: 120 },
  { prop: 'email', label: 'Email', minWidth: 180 },
  { prop: 'role', label: 'Role', width: 100 },
  { prop: 'status', label: 'Status', width: 100 },
]

const meta: Meta<typeof PortalTable> = {
  title: 'Components/PortalTable',
  component: PortalTable,
  tags: ['autodocs'],
  argTypes: {
    pagination: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof PortalTable>

export const Default: Story = {
  render: () => ({
    components: { PortalTable },
    setup() { return { sampleData, columns } },
    template: '<PortalTable :data="sampleData" :columns="columns" />',
  }),
}

export const WithPagination: Story = {
  render: () => ({
    components: { PortalTable },
    setup() { return { sampleData, columns } },
    template: '<PortalTable :data="sampleData" :columns="columns" :pagination="true" :total="50" :page="1" :page-size="10" />',
  }),
}

export const Striped: Story = {
  render: () => ({
    components: { PortalTable },
    setup() { return { sampleData, columns } },
    template: '<PortalTable :data="sampleData" :columns="columns" stripe />',
  }),
}

export const Empty: Story = {
  render: () => ({
    components: { PortalTable },
    setup() { return { columns } },
    template: '<PortalTable :data="[]" :columns="columns" />',
  }),
}
