import type { Meta, StoryObj } from '@storybook/vue3'
import PortalProgressBars from '../PortalProgressBars.vue'

const meta: Meta<typeof PortalProgressBars> = {
  title: 'Components/PortalProgressBars',
  component: PortalProgressBars,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['slider', 'bar', 'steps', 'circle'] },
    percentage: { control: { type: 'range', min: 0, max: 100 } },
    status: { control: 'select', options: ['', 'success', 'exception', 'warning'] },
  },
}
export default meta

type Story = StoryObj<typeof PortalProgressBars>

export const Bar: Story = {
  args: { type: 'bar', percentage: 65 },
}

export const Slider: Story = {
  args: { type: 'slider', percentage: 40 },
}

export const Circle: Story = {
  args: { type: 'circle', percentage: 75 },
}

export const Steps: Story = {
  args: { type: 'steps', steps: [1, 2, 3, 4, 5], currentStep: 3 },
}

export const AllTypes: Story = {
  render: () => ({
    components: { PortalProgressBars },
    template: `
      <div style="display: flex; flex-direction: column; gap: 32px; padding: 20px;">
        <div><strong>Bar:</strong><PortalProgressBars type="bar" :percentage="65" /></div>
        <div><strong>Slider:</strong><PortalProgressBars type="slider" :percentage="40" /></div>
        <div><strong>Circle:</strong><PortalProgressBars type="circle" :percentage="75" /></div>
        <div><strong>Steps:</strong><PortalProgressBars type="steps" :steps="[1,2,3,4]" :current-step="2" /></div>
      </div>
    `,
  }),
}
