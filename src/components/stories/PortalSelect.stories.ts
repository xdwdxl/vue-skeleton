import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import PortalSelect from '../PortalSelect.vue'

const sampleOptions = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4', disabled: true },
]

const groupedOptions = [
  { label: 'Group A', children: [{ value: 'a1', label: 'Item A1' }, { value: 'a2', label: 'Item A2' }] },
  { label: 'Group B', children: [{ value: 'b1', label: 'Item B1' }, { value: 'b2', label: 'Item B2' }] },
]

const meta: Meta<typeof PortalSelect> = {
  title: 'Components/PortalSelect',
  component: PortalSelect,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['large', 'default', 'small'] },
    multiple: { control: 'boolean' },
    filterable: { control: 'boolean' },
    clearable: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof PortalSelect>

export const Default: Story = {
  render: (args) => ({
    components: { PortalSelect },
    setup() { const val = ref(''); return { args, val, sampleOptions } },
    template: '<PortalSelect v-bind="args" v-model="val" :options="sampleOptions" placeholder="Select an option" />',
  }),
}

export const Multiple: Story = {
  render: () => ({
    components: { PortalSelect },
    setup() { const val = ref([]); return { val, sampleOptions } },
    template: '<PortalSelect v-model="val" :options="sampleOptions" :multiple="true" :collapse-tags="true" />',
  }),
}

export const Filterable: Story = {
  render: () => ({
    components: { PortalSelect },
    setup() { const val = ref(''); return { val, sampleOptions } },
    template: '<PortalSelect v-model="val" :options="sampleOptions" :filterable="true" />',
  }),
}

export const Grouped: Story = {
  render: () => ({
    components: { PortalSelect },
    setup() { const val = ref(''); return { val, groupedOptions } },
    template: '<PortalSelect v-model="val" :options="groupedOptions" :grouped="true" />',
  }),
}

export const Clearable: Story = {
  render: () => ({
    components: { PortalSelect },
    setup() { const val = ref('1'); return { val, sampleOptions } },
    template: '<PortalSelect v-model="val" :options="sampleOptions" :clearable="true" />',
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { PortalSelect },
    setup() { const val = ref('1'); return { val, sampleOptions } },
    template: '<PortalSelect v-model="val" :options="sampleOptions" :disabled="true" />',
  }),
}
