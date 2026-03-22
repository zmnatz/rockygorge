import type { Meta, StoryObj } from '@storybook/react';
import { ScoreCard } from '../components/Scores/ScoreCard';
import { Score } from '../components/Scores/types';

const meta = {
  title: 'Components/Scores/ScoreCard',
  component: ScoreCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScoreCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const score: Score = {
  compName: 'Test Competition',
  dateTime: new Date(),
  homeTeam: {
    name: 'Home Team',
    score: '20',
    crest: 'https://via.placeholder.com/40',
    teamId: '1',
  },
  awayTeam: {
    name: 'Away Team',
    score: '10',
    crest: 'https://via.placeholder.com/40',
    teamId: '2',
  },
};

export const Default: Story = {
  args: {
    score,
  },
};
