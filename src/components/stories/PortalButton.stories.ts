import type { Meta, StoryObj } from '@storybook/vue3'
import PortalButton from '../PortalButton.vue'

const meta: Meta<typeof PortalButton> = {
  title: 'Components/PortalButton',
  component: PortalButton,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['form', 'square'] },
    color: { control: 'select', options: ['primary', 'default', 'dark', 'white', 'success', 'info', 'danger', 'warning'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof PortalButton>

export const FormPrimary: Story = {
  args: { type: 'form', color: 'primary' },
  render: (args) => ({
    components: { PortalButton },
    setup() { return { args } },
    template: '<PortalButton v-bind="args">Primary</PortalButton>',
  }),
}

export const FormSuccess: Story = {
  args: { type: 'form', color: 'success' },
  render: (args) => ({
    components: { PortalButton },
    setup() { return { args } },
    template: '<PortalButton v-bind="args">Success</PortalButton>',
  }),
}

export const FormDanger: Story = {
  args: { type: 'form', color: 'danger' },
  render: (args) => ({
    components: { PortalButton },
    setup() { return { args } },
    template: '<PortalButton v-bind="args">Delete</PortalButton>',
  }),
}

export const FormInfo: Story = {
  args: { type: 'form', color: 'info' },
  render: (args) => ({
    components: { PortalButton },
    setup() { return { args } },
    template: '<PortalButton v-bind="args">Edit</PortalButton>',
  }),
}

export const FormWarning: Story = {
  args: { type: 'form', color: 'warning' },
  render: (args) => ({
    components: { PortalButton },
    setup() { return { args } },
    template: '<PortalButton v-bind="args">Warning</PortalButton>',
  }),
}

export const FormWhite: Story = {
  args: { type: 'form', color: 'white' },
  render: (args) => ({
    components: { PortalButton },
    setup() { return { args } },
    template: '<PortalButton v-bind="args">Cancel</PortalButton>',
  }),
}

export const SquareSmall: Story = {
  args: { type: 'square', size: 'sm', color: 'primary' },
  render: (args) => ({
    components: { PortalButton },
    setup() { return { args } },
    template: '<PortalButton v-bind="args">+</PortalButton>',
  }),
}

export const SquareMedium: Story = {
  args: { type: 'square', size: 'md', color: 'info' },
  render: (args) => ({
    components: { PortalButton },
    setup() { return { args } },
    template: '<PortalButton v-bind="args">E</PortalButton>',
  }),
}

export const SquareLarge: Story = {
  args: { type: 'square', size: 'lg', color: 'danger' },
  render: (args) => ({
    components: { PortalButton },
    setup() { return { args } },
    template: '<PortalButton v-bind="args">X</PortalButton>',
  }),
}

export const Disabled: Story = {
  args: { type: 'form', color: 'primary', disabled: true },
  render: (args) => ({
    components: { PortalButton },
    setup() { return { args } },
    template: '<PortalButton v-bind="args">Disabled</PortalButton>',
  }),
}

export const Loading: Story = {
  args: { type: 'form', color: 'primary', loading: true },
  render: (args) => ({
    components: { PortalButton },
    setup() { return { args } },
    template: '<PortalButton v-bind="args">Loading</PortalButton>',
  }),
}

export const AllColors: Story = {
  render: () => ({
    components: { PortalButton },
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <PortalButton type="form" color="primary">Primary</PortalButton>
        <PortalButton type="form" color="default">Default</PortalButton>
        <PortalButton type="form" color="dark">Dark</PortalButton>
        <PortalButton type="form" color="white">White</PortalButton>
        <PortalButton type="form" color="success">Success</PortalButton>
        <PortalButton type="form" color="info">Info</PortalButton>
        <PortalButton type="form" color="danger">Danger</PortalButton>
        <PortalButton type="form" color="warning">Warning</PortalButton>
      </div>
    `,
  }),
}
