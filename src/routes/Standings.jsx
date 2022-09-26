import { Table } from "antd";
import Column from "antd/lib/table/Column";
import React, { useEffect, useState } from "react";

async function getStandings(competition) {
  const response = await fetch(
    "https://rugby-au-cms.onrender.com/api/graphql",
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        operationName: "CompLadderQuery",
        variables: { comp: { id: competition, sourceType: "2" } },
        query: `query CompLadderQuery($comp: CompInput) {
            compLadder(comp: $comp) {
              ...LadderCard_ladder
              __typename
            }
          }
          
          fragment LadderCard_ladder on Ladder {
            id
            poolName
            teams {
              ...LadderCard_ladderTeam
              __typename
            }
            __typename
          }
          
          fragment LadderCard_ladderTeam on LadderTeam {
            id
            position
            name
            crest
            active
            played
            won
            draw
            loss
            pointsDifference
            bonusPoints
            points
            __typename
          }`
      })
    }
  );
  return await response.json();
}

function Standings({ team }) {
  const [standings, setStandings] = useState();
  useEffect(() => {
    getStandings(team).then(setStandings);
  }, [team]);
  return (
    <Table
      pagination={{ position: ["none", "none"] }}
      dataSource={standings?.data?.compLadder[0]?.teams}
    >
      <Column title="Name" dataIndex="name" key="name" />
      <Column title="P" dataIndex="played" key="played" />
      <Column dataIndex="won" title="W" key="won" />
      <Column dataIndex="draw" title="D" key="draw" />
      <Column dataIndex="loss" title="L" key="loss" />
      <Column dataIndex="pointsDifference" title="+/-" key="pointsDifference" />
      <Column dataIndex="points" title="Points" key="points" />
    </Table>
  );
}

export default () => {
  return (
    <>
      <Standings team="gLouDHbvxHCEGAPpd" />
      <Standings team="9yRwHG6BFwxp7BQrQ" />
    </>
  );
};
