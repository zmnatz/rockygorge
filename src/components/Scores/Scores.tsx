import React from "react";
import Grid from '@mui/material/Grid';
import {useScores} from './useScores'
import { ScoreCard } from "./ScoreCard";

export function Scores () {
  const scores = useScores()
  return (
    <Grid container spacing={2}>
      {scores.map((score, index) => (
        <Grid
          key={index}
          size={{
            xs: 12,
            sm: 6
          }}>
          <ScoreCard score={score} />
        </Grid>
      ))}
    </Grid>
  );
}