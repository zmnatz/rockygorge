import type { Meta, StoryObj } from '@storybook/react';
import Product from '../components/Product';

const meta = {
  title: 'Components/Product',
  component: Product,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Product>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Product Title',
    children: 'Product content goes here',
  },
};
