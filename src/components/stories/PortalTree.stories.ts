import type { Meta, StoryObj } from '@storybook/vue3'
import PortalTree from '../PortalTree.vue'

const treeData = [
  {
    label: 'Level 1 - Node 1',
    children: [
      { label: 'Level 2 - Node 1-1', children: [{ label: 'Level 3 - Node 1-1-1' }, { label: 'Level 3 - Node 1-1-2' }] },
      { label: 'Level 2 - Node 1-2' },
    ],
  },
  {
    label: 'Level 1 - Node 2',
    children: [
      { label: 'Level 2 - Node 2-1' },
      { label: 'Level 2 - Node 2-2', children: [{ label: 'Level 3 - Node 2-2-1' }] },
    ],
  },
  { label: 'Level 1 - Node 3 (leaf)' },
]

const meta: Meta<typeof PortalTree> = {
  title: 'Components/PortalTree',
  component: PortalTree,
  tags: ['autodocs'],
  argTypes: {
    defaultExpandAll: { control: 'boolean' },
    showCheckbox: { control: 'boolean' },
    accordion: { control: 'boolean' },
    highlightCurrent: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof PortalTree>

export const Default: Story = {
  render: () => ({
    components: { PortalTree },
    setup() { return { treeData } },
    template: '<PortalTree :data="treeData" :default-expand-all="true" />',
  }),
}

export const WithCheckbox: Story = {
  render: () => ({
    components: { PortalTree },
    setup() { return { treeData } },
    template: '<PortalTree :data="treeData" :show-checkbox="true" :default-expand-all="true" />',
  }),
}

export const Accordion: Story = {
  render: () => ({
    components: { PortalTree },
    setup() { return { treeData } },
    template: '<PortalTree :data="treeData" :accordion="true" />',
  }),
}

export const HighlightCurrent: Story = {
  render: () => ({
    components: { PortalTree },
    setup() { return { treeData } },
    template: '<PortalTree :data="treeData" :highlight-current="true" :default-expand-all="true" />',
  }),
}
