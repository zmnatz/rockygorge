import React from "react";
import { Carousel } from "antd";
import {useScores} from './useScores'
import { ScoreCard } from "./ScoreCard";

export function Scores () {
  const scores = useScores()
  return <Carousel slidesToShow={2} autoplay arrows autoplaySpeed={5000}>
    {scores.map((score, index) => (
        <ScoreCard key={index} score={score}/>
    ))}
  </Carousel>
}