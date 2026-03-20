import type { Meta, StoryObj } from '@storybook/vue3'
import PortalCard from '../PortalCard.vue'

const meta: Meta<typeof PortalCard> = {
  title: 'Components/PortalCard',
  component: PortalCard,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    buttonType: { control: 'select', options: ['actions', 'form', 'downLoad'] },
    showHeader: { control: 'boolean' },
    showFooter: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof PortalCard>

export const Default: Story = {
  args: { title: 'Card Title', buttonType: 'actions', showView: true, showAdd: true, showEdit: true, showDelete: true },
  render: (args) => ({
    components: { PortalCard },
    setup() { return { args } },
    template: '<div style="height:400px"><PortalCard v-bind="args"><p>Card content goes here</p></PortalCard></div>',
  }),
}

export const FormMode: Story = {
  args: { title: 'Edit Form', buttonType: 'form', showCancel: true, showSave: true },
  render: (args) => ({
    components: { PortalCard },
    setup() { return { args } },
    template: '<div style="height:400px"><PortalCard v-bind="args"><p>Form content goes here</p></PortalCard></div>',
  }),
}

export const DownloadMode: Story = {
  args: { title: 'Download Report', buttonType: 'downLoad' },
  render: (args) => ({
    components: { PortalCard },
    setup() { return { args } },
    template: '<div style="height:400px"><PortalCard v-bind="args"><p>Report preview content</p></PortalCard></div>',
  }),
}

export const NoHeaderNoFooter: Story = {
  args: { showHeader: false, showFooter: false },
  render: (args) => ({
    components: { PortalCard },
    setup() { return { args } },
    template: '<div style="height:400px"><PortalCard v-bind="args"><p>Clean card without header or footer</p></PortalCard></div>',
  }),
}
