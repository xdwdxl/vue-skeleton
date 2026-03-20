import type { Meta, StoryObj } from '@storybook/vue3'
import BuilderPage from '../BuilderPage.vue'

const meta: Meta<typeof BuilderPage> = {
  title: 'Builder/Preview',
  component: BuilderPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Builder.io content renderer. Set the Preview URL in Builder.io to this story\'s iframe URL to enable visual editing with all Portal components.',
      },
    },
  },
  argTypes: {
    model: {
      control: 'select',
      options: ['page', 'section', 'figma-imports'],
      description: 'Builder.io content model',
    },
    path: {
      control: 'text',
      description: 'URL path to fetch content for',
    },
    apiKey: {
      control: 'text',
      description: 'Builder.io Public API Key',
    },
  },
}
export default meta

type Story = StoryObj<typeof BuilderPage>

export const Default: Story = {
  args: {
    model: 'page',
    path: '/',
  },
}

export const Section: Story = {
  args: {
    model: 'section',
    path: '/',
  },
}

export const FigmaImports: Story = {
  args: {
    model: 'figma-imports',
    path: '/',
  },
}
