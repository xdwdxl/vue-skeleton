import type { Meta, StoryObj } from '@storybook/vue3'
import PortalToolTip from '../PortalToolTip.vue'
import PortalButton from '../PortalButton.vue'

const meta: Meta<typeof PortalToolTip> = {
  title: 'Components/PortalToolTip',
  component: PortalToolTip,
  tags: ['autodocs'],
  argTypes: {
    placement: { control: 'select', options: ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'left', 'right'] },
    effect: { control: 'select', options: ['dark', 'light'] },
    trigger: { control: 'select', options: ['hover', 'click', 'focus'] },
    disabled: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof PortalToolTip>

export const Default: Story = {
  render: () => ({
    components: { PortalToolTip, PortalButton },
    template: `
      <div style="padding: 60px;">
        <PortalToolTip content="This is a tooltip">
          <PortalButton type="form" color="primary">Hover me</PortalButton>
        </PortalToolTip>
      </div>
    `,
  }),
}

export const LightEffect: Story = {
  render: () => ({
    components: { PortalToolTip, PortalButton },
    template: `
      <div style="padding: 60px;">
        <PortalToolTip content="Light tooltip" effect="light">
          <PortalButton type="form" color="info">Light</PortalButton>
        </PortalToolTip>
      </div>
    `,
  }),
}

export const ClickTrigger: Story = {
  render: () => ({
    components: { PortalToolTip, PortalButton },
    template: `
      <div style="padding: 60px;">
        <PortalToolTip content="Click triggered tooltip" trigger="click">
          <PortalButton type="form" color="warning">Click me</PortalButton>
        </PortalToolTip>
      </div>
    `,
  }),
}

export const Placements: Story = {
  render: () => ({
    components: { PortalToolTip, PortalButton },
    template: `
      <div style="padding: 80px; display: flex; gap: 12px; flex-wrap: wrap;">
        <PortalToolTip content="Top" placement="top"><PortalButton type="form" color="primary">Top</PortalButton></PortalToolTip>
        <PortalToolTip content="Bottom" placement="bottom"><PortalButton type="form" color="info">Bottom</PortalButton></PortalToolTip>
        <PortalToolTip content="Left" placement="left"><PortalButton type="form" color="success">Left</PortalButton></PortalToolTip>
        <PortalToolTip content="Right" placement="right"><PortalButton type="form" color="warning">Right</PortalButton></PortalToolTip>
      </div>
    `,
  }),
}
