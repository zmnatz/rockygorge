import fs from 'node:fs'
import path from 'node:path'
import { parseCsv } from '@/utils/csv'

export function loadStatsFromCsv() {
  const statsDir = path.join(process.cwd(), 'content/stats')
  const games: any[] = []

  const teamCsvPath = path.join(statsDir, 'team.csv')
  const playersCsvPath = fs.existsSync(path.join(statsDir, 'players.csv')) 
    ? path.join(statsDir, 'players.csv') 
    : fs.existsSync(path.join(statsDir, 'player.csv')) 
      ? path.join(statsDir, 'player.csv') 
      : null

  if (fs.existsSync(teamCsvPath) && playersCsvPath) {
    const teamText = fs.readFileSync(teamCsvPath, 'utf8')
    const playersText = fs.readFileSync(playersCsvPath, 'utf8')

    const teamRows = parseCsv(teamText)
    const playerRows = parseCsv(playersText)

    if (teamRows.length > 1) {
      const teamHeader = teamRows[0]
      const teamDataRows = teamRows.slice(1)

      const playerHeader = playerRows.length > 0 ? playerRows[0] : []
      const playerDataRows = playerRows.length > 1 ? playerRows.slice(1) : []

      teamDataRows.forEach((tRow) => {
        if (tRow.length < teamHeader.length) return
        const season = tRow[teamHeader.indexOf('season')]
        const date = tRow[teamHeader.indexOf('date')] || ''
        const team = tRow[teamHeader.indexOf('team')] || 'Rocky Gorge D1'
        const division = team.includes('D3') ? 'D3' : 'D1'
        const opponent = tRow[teamHeader.indexOf('opponent')]
        const result = tRow[teamHeader.indexOf('result')]
        const scoreFor = tRow[teamHeader.indexOf('score_for')]
        const scoreAgainst = tRow[teamHeader.indexOf('score_against')]
        const gameTitle = `${team} vs ${opponent}`

        const teamStats: Record<string, any> = {
          total_penalties_gorge: Number(tRow[teamHeader.indexOf('total_penalties')] || 0),
          total_penalties_opponent: Number(tRow[teamHeader.indexOf('opponent_penalties')] || 0),
          total_knocks_gorge: Number(tRow[teamHeader.indexOf('total_knocks')] || 0),
          total_knocks_opponent: Number(tRow[teamHeader.indexOf('opponent_knocks')] || 0),
          double_tackles: tRow[teamHeader.indexOf('double_tackles')],
          scrums_won: tRow[teamHeader.indexOf('scrums_won')],
          scrums_lost: tRow[teamHeader.indexOf('scrums_lost')],
          scrums_stolen: tRow[teamHeader.indexOf('scrums_stolen')],
          lineouts_won: tRow[teamHeader.indexOf('lineouts_won')],
          lineouts_lost: tRow[teamHeader.indexOf('lineouts_lost')],
          lineouts_stolen: tRow[teamHeader.indexOf('lineouts_stolen')],
          total_tackles_made: Number(tRow[teamHeader.indexOf('total_tackles_made')] || 0),
          total_tackles_missed: Number(tRow[teamHeader.indexOf('total_tackles_missed')] || 0),
          tackle_percentage: tRow[teamHeader.indexOf('team_tackle_percentage')],
          maul_success: tRow[teamHeader.indexOf('maul_success')],
        }

        const gamePlayers: any[] = []
        playerDataRows.forEach((pRow) => {
          if (pRow.length < playerHeader.length) return
          const pSeason = pRow[playerHeader.indexOf('season')]
          const pOpponent = pRow[playerHeader.indexOf('opponent')] || pRow[playerHeader.indexOf('game')] || ''
          
          const matchesSeason = !season || !pSeason || pSeason === season
          const matchesOpponent = pOpponent && (pOpponent.includes(opponent) || opponent.includes(pOpponent))

          if (matchesSeason && matchesOpponent) {
            const parseNum = (colName: string) => {
              const idx = playerHeader.indexOf(colName)
              if (idx === -1) return 0
              const val = Number(pRow[idx])
              return isNaN(val) ? 0 : val
            }

            const playerName = pRow[playerHeader.indexOf('player')] || ''
            const jersey = pRow[playerHeader.indexOf('jersey')] || ''

            gamePlayers.push({
              name: playerName,
              jersey,
              positive_carries: parseNum('positive_carries'),
              negative_carries: parseNum('negative_carries'),
              line_breaks: parseNum('line_breaks'),
              tries_scored: parseNum('tries_scored'),
              tackle_breaks: parseNum('tackle_breaks'),
              off_loads: parseNum('offloads') || parseNum('off_loads'),
              offloads: parseNum('offloads') || parseNum('off_loads'),
              turnovers_given: parseNum('turnovers_given'),
              try_assists: parseNum('try_assists'),
              tackles_made: parseNum('tackles_made'),
              tackles_missed: parseNum('tackles_missed'),
              steals: parseNum('steals'),
              defensive_rucks: parseNum('defensive_rucks'),
              dominant_tackles: parseNum('dominant_tackles'),
              turnovers_forced: parseNum('turnovers_forced'),
              penalties_conceded: parseNum('penalties') || parseNum('penalties_conceded'),
              penalties: parseNum('penalties') || parseNum('penalties_conceded'),
              attacking_rucks: parseNum('attacking_rucks'),
              penalty_reasons: '',
            })
          }
        })

        games.push({
          season,
          date,
          team,
          division,
          opponent,
          game: gameTitle,
          result,
          score_for: scoreFor,
          score_against: scoreAgainst,
          team_stats: teamStats,
          players: gamePlayers,
        })
      })
    }
  }

  return { games }
}
