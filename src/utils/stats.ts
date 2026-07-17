export const STAT_CATEGORIES: Record<string, string[]> = {
  Offensive: ['tries_scored', 'try_assists', 'positive_carries', 'negative_carries', 'line_breaks', 'attacking_rucks', 'tackle_breaks', 'off_loads'],
  Defensive: ['tackles_made', 'tackles_missed', 'dominant_tackles', 'steals', 'defensive_rucks', 'turnovers_forced'],
  Penalties: ['penalties_conceded', 'penalty_reasons', 'turnovers_given']
}

export const TEAM_STAT_CATEGORIES: Record<string, string[]> = {
  Offensive: ['ruckable_carries', 'ruck_arrivals', 'avg_players_committed_to_ruck', 'maul_success', 'lineouts_won', 'scrums_won'],
  Defensive: ['total_tackles_made', 'total_tackles_missed', 'tackle_percentage', 'double_tackles', 'lineouts_stolen', 'scrums_stolen'],
  Penalties: ['total_penalties_gorge', 'total_penalties_opponent', 'total_knocks_gorge', 'total_knocks_opponent', 'lineouts_lost', 'scrums_lost']
}

export function formatColumnTitle(key: string) {
  if (key === 'name') return 'Player'
  if (key === 'game') return 'Opponent'
  return key.replace(/_/g, ' ').split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export function getSortableName(name: string) {
  const parts = name.trim().split(/\s+/)
  const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : ''
  return `${lastName}, ${firstName}`.toLowerCase()
}

export function aggregatePlayerStats(playerDataByGame: any[]) {
  const aggregated: Record<string, any> = {}
  playerDataByGame.forEach((row) => {
    const playerName = row.name
    if (!aggregated[playerName]) aggregated[playerName] = { name: playerName }
    Object.keys(row).forEach((key) => {
      if (key !== 'name' && key !== 'game' && key !== 'key') {
        const value = row[key]
        if (typeof value === 'number') {
          aggregated[playerName][key] = (aggregated[playerName][key] || 0) + value
        } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
          aggregated[playerName][key] = (aggregated[playerName][key] || 0) + parseFloat(value)
        } else {
          aggregated[playerName][key] = value
        }
      }
    })
  })
  return Object.values(aggregated).map((player) => ({ key: `agg-${player.name}`, ...player }))
}
