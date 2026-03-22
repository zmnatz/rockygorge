import type { Meta, StoryObj } from '@storybook/react';
import PaypalProduct from '../components/PaypalProduct';

const meta = {
  title: 'Components/PaypalProduct',
  component: PaypalProduct,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PaypalProduct>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    description: 'Product Description',
    defaultAmount: 25,
    options: [
      { name: 'Option 1', value: 25 },
      { name: 'Option 2', value: 50 },
    ],
    children: <div>Product Children</div>,
  },
};

export const FlexiblePayment: Story = {
  args: {
    ...Default.args,
    flexiblePayment: true,
  },
};

export const Donation: Story = {
  args: {
    ...Default.args,
    donation: true,
  },
};

export const WithSubscriptions: Story = {
  args: {
    ...Default.args,
    subscriptions: [{
      id: 'I-12345',
      name: 'Test Subscription',
      description: 'A subscription for testing',
      options: [
        { label: 'Option 1', value: 'P-123' },
        { label: 'Option 2', value: 'P-456' },
      ]
    }]
  },
};

export const WithSupporters: Story = {
  args: {
    ...Default.args,
    supporters: ['Supporter 1', 'Supporter 2', 'Supporter 3'],
  },
};
