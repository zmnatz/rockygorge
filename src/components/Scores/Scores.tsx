import Grid from "@mui/material/Grid";
import React from "react";
import { useScores } from "@/api/scores";
import { ScoreCard } from "./ScoreCard";

export function Scores() {
  const scores = useScores();
  return (
    <Grid container spacing={2}>
      {scores.map((score, index) => {
        return (
          <Grid
            // biome-ignore lint/suspicious/noArrayIndexKey: read-only score cards; order never reorders
            key={index}
            size={{ xs: 12, sm: 6 }}
          >
            <ScoreCard score={score} />
          </Grid>
        );
      })}
    </Grid>
  );
}
