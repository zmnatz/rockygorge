import React from "react"
import { Card } from "antd"

export function ScoreCard({score}) {
    return <Card size="small" className="score-card" title={score.compName} type="inner">
      <TeamBadge team={score.homeTeam}/>
      <div style={{textAlign: 'center'}}>
        <div>{score.homeTeam.score} - {score.awayTeam.score} </div>
        <h4>{new Date(score.dateTime).toLocaleDateString()}</h4>
      </div>
      <TeamBadge team={score.awayTeam}/>
    </Card>
  }
  
  function TeamBadge({team}) {
    return <img height="40" src={team.crest} title={team.name} alt={team.name}/>
  }