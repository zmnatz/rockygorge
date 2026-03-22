import type { Meta, StoryObj } from '@storybook/react';
import { Toolbar } from '../components/Toolbar';

const meta = {
  title: 'Components/Toolbar',
  component: Toolbar,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    links: [
      {
        id: '/link',
        title: 'Link 1',
        description: 'Link description'
      },
      {
        id: '/link2',
        title: 'Link 2',
        description: 'Link description'
      }
    ]
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Menu: Story = {
  globals: {
    viewport: { value: 'mobile1' },
  }
}