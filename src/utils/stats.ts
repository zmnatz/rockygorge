export const STAT_CATEGORIES: Record<string, string[]> = {
  Offensive: ['tries_scored', 'try_assists', 'positive_carries', 'negative_carries', 'line_breaks', 'attacking_rucks', 'tackle_breaks', 'off_loads'],
  Defensive: ['tackles_made', 'tackles_missed', 'dominant_tackles', 'steals', 'defensive_rucks', 'turnovers_forced'],
  Penalties: ['turnovers_given', 'penalties_conceded', 'penalty_reasons']
}

export const TEAM_STAT_CATEGORIES: Record<string, string[]> = {
  Offensive: ['maul_success', 'positive_carries', 'negative_carries', 'line_breaks', 'tackle_breaks', 'off_loads'],
  Defensive: ['total_tackles_made', 'total_tackles_missed', 'tackle_percentage', 'double_tackles'],
  'Set pieces': ['scrums_won', 'scrums_lost', 'scrums_stolen', 'lineouts_won', 'lineouts_lost', 'lineouts_stolen'],
  Penalties: ['total_penalties_gorge', 'total_penalties_opponent', 'total_knocks_gorge', 'total_knocks_opponent'],
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

export interface PlayerStatRow {
  name: string;
  game?: string;
  key?: string;
  [key: string]: unknown;
}

export interface AggregatedPlayerStats extends Record<string, unknown> {
  key: string;
  name: string;
}

export function aggregatePlayerStats(playerDataByGame: PlayerStatRow[]): AggregatedPlayerStats[] {
  const aggregated: Record<string, Record<string, unknown>> = {}
  playerDataByGame.forEach((row) => {
    const playerName = row.name
    if (!aggregated[playerName]) aggregated[playerName] = { name: playerName }
    Object.keys(row).forEach((key) => {
      if (key !== 'name' && key !== 'game' && key !== 'key') {
        const value = row[key]
        if (typeof value === 'number') {
          aggregated[playerName][key] = (Number(aggregated[playerName][key]) || 0) + value
        } else if (typeof value === 'string' && !Number.isNaN(parseFloat(value))) {
          aggregated[playerName][key] = (Number(aggregated[playerName][key]) || 0) + parseFloat(value)
        } else {
          aggregated[playerName][key] = value
        }
      }
    })
  })
  return Object.values(aggregated).map((player) => ({
    key: `agg-${String(player.name)}`,
    ...player,
  })) as AggregatedPlayerStats[]
}
