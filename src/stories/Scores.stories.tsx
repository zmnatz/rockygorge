import type { Meta, StoryObj } from '@storybook/react';
import { Scores } from '../components/Scores/Scores';
import * as scoreHooks from '../components/Scores/useScores';
import { Score } from '../components/Scores/types';
import { vi } from 'vitest';

const meta = {
  title: 'Components/Scores/Scores',
  component: Scores,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Scores>;

export default meta;
type Story = StoryObj<typeof meta>;

const scores: Score[] = [
  {
    compName: 'Test Competition 1',
    dateTime: new Date(),
    homeTeam: {
      name: 'Home Team 1',
      score: '20',
      crest: 'https://via.placeholder.com/40',
      teamId: '1',
    },
    awayTeam: {
      name: 'Away Team 1',
      score: '10',
      crest: 'https://via.placeholder.com/40',
      teamId: '2',
    },
  },
  {
    compName: 'Test Competition 2',
    dateTime: new Date(),
    homeTeam: {
      name: 'Home Team 2',
      score: '30',
      crest: 'https://via.placeholder.com/40',
      teamId: '3',
    },
    awayTeam: {
      name: 'Away Team 2',
      score: '40',
      crest: 'https://via.placeholder.com/40',
      teamId: '4',
    },
  },
];

export const Default: Story = {
  decorators: [
    (Story) => {
      vi.spyOn(scoreHooks, 'useScores').mockReturnValue(scores);
      return <Story />;
    },
  ],
};

export const Empty: Story = {
  decorators: [
    (Story) => {
      vi.spyOn(scoreHooks, 'useScores').mockReturnValue([]);
      return <Story />;
    },
  ],
};
