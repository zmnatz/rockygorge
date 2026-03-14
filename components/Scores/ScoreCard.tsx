import React from 'react';
import { Card } from 'antd';
import { Score, Team } from './types';

interface ScoreCardProps {
  score: Score;
}

export function ScoreCard({ score }: ScoreCardProps): JSX.Element {
  return (
    <Card size="small" className="score-card" title={score.compName}>
      <TeamBadge team={score.homeTeam} />
      <div style={{ textAlign: 'center' }}>
        <div>
          {score.homeTeam.score} - {score.awayTeam.score}
        </div>
        <h4>{new Date(score.dateTime).toLocaleDateString()}</h4>
      </div>
      <TeamBadge team={score.awayTeam} />
    </Card>
  );
}

interface TeamBadgeProps {
  team: Team;
}

function TeamBadge({ team }: TeamBadgeProps): JSX.Element {
  return <img height="40" src={team.crest} title={team.name} alt={team.name} />;
}