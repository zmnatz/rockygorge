import type { Meta, StoryObj } from '@storybook/react';
import BanquetTickets from '../components/BanquetTickets';

const meta = {
  title: 'Components/BanquetTickets',
  component: BanquetTickets,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BanquetTickets>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
