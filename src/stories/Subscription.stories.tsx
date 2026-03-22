import type { Meta, StoryObj } from '@storybook/react';
import { Subscription } from '../components/Subscription';

const meta = {
  title: 'Components/Subscription',
  component: Subscription,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Subscription>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: '12345',
    name: 'Subscription Name',
    description: 'Subscription description',
    options: [
      { label: 'Option 1', value: '1' },
      { label: 'Option 2', value: '2' },
    ],
  },
};
