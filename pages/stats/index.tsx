import stats from '@content/stats/stats.yml'
import { 
  Select, MenuItem, FormControl, InputLabel, Box, Tabs, Tab, 
  TextField, Link as MuiLink, ToggleButton, ToggleButtonGroup, Typography
} from '@mui/material'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { STAT_CATEGORIES, TEAM_STAT_CATEGORIES, formatColumnTitle, aggregatePlayerStats } from '@/utils/stats'
import { slugify } from '@/utils/slugify'
import { SortableTable } from '@/components/SortableTable'

export async function getStaticProps() {
  const games = Array.isArray(stats.games) ? stats.games : []
  const firstPlayer = games?.[0]?.players?.[0] || {}
  const playerColumns = [
    { title: 'Player', dataIndex: 'name', key: 'name', minWidth: 200 },
    ...Object.keys(firstPlayer).filter((key) => key !== 'name' && key !== 'game').map((key) => ({
      title: formatColumnTitle(key), dataIndex: key, key,
    })),
  ]
  const playerDataByGame = games.flatMap((game) =>
    Array.isArray(game.players) ? game.players.map((player) => ({
      key: `${game.opponent}-${player.name}`, game: game.opponent, season: game.season, ...player,
    })) : []
  )
  const gameList = games.map((game) => game.opponent)
  const firstTeamStats = games?.[0]?.team_stats || {}
  const teamColumns = [
    { title: 'Game', dataIndex: 'game', key: 'game' },
    ...Object.keys(firstTeamStats).map((key) => ({
      title: formatColumnTitle(key), dataIndex: key, key,
    })),
  ]
  const teamData = games.map((game) => ({
    key: game.opponent, game: game.opponent, ...game.team_stats,
  }))
  return { props: { playerColumns, playerDataByGame, gameList, teamColumns, teamData } }
}

export default function StatsPage({ playerColumns, playerDataByGame, gameList, teamColumns, teamData }) {
  const [activeTab, setActiveTab] = useState(0)
  const [selectedGame, setSelectedGame] = useState('') // '' = Aggregate, 'all_detailed' = Individual, 'OpponentName' = Filtered
  const [playerSearch, setPlayerSearch] = useState('')
  const [visibleCategories, setVisibleCategories] = useState<string[]>(['Offensive', 'Defensive', 'Penalties'])

  const handleCategoryChange = (
    event: React.MouseEvent<HTMLElement>,
    newCategories: string[],
  ) => {
    if (newCategories.length) {
      setVisibleCategories(newCategories)
    }
  }

  // 1. Dynamically adjust columns based on the view mode and category filters
  const displayPlayerColumns = useMemo(() => {
    let cols = playerColumns
    if (selectedGame === 'all_detailed') {
      cols = [
        { title: 'Opponent', dataIndex: 'game', key: 'game' },
        { title: 'Season', dataIndex: 'season', key: 'season' },
        ...playerColumns
      ]
    }

    return cols.filter(col => {
      if (col.key === 'game' || col.key === 'name' || col.key === 'season') return true
      return Object.entries(STAT_CATEGORIES).some(([category, fields]) => 
        visibleCategories.includes(category) && fields.includes(col.key)
      )
    })
  }, [playerColumns, selectedGame, visibleCategories])

  // 2. Updated data logic to handle the "all_detailed" case
  const filteredPlayerData = useMemo(() => {
    let data = []

    if (selectedGame === 'all_detailed') {
      // Show every row for every game
      data = playerDataByGame
    } else if (selectedGame) {
      // Show specific game
      data = playerDataByGame.filter((row) => row.game === selectedGame)
    } else {
      // Aggregate all games
      data = aggregatePlayerStats(playerDataByGame)
    }

    // Apply text search to whichever dataset we have
    if (playerSearch) {
      const searchLower = playerSearch.toLowerCase()
      data = data.filter((player) => player.name?.toLowerCase().includes(searchLower))
    }

    return data
  }, [playerDataByGame, selectedGame, playerSearch])

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <h2>Team Statistics</h2>
      </Box>
      
      <Tabs 
        value={activeTab} 
        onChange={(_, newValue) => setActiveTab(newValue)} 
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Player Stats" />
        <Tab label="Team Stats" />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>View Mode / Game</InputLabel>
              <Select 
                value={selectedGame} 
                onChange={(e) => setSelectedGame(e.target.value)} 
                label="View Mode / Game"
                size="small"
              >
                <MenuItem value=""><em>All Games (Aggregated)</em></MenuItem>
                <MenuItem value="all_detailed"><strong>Show All Games (Detailed)</strong></MenuItem>
                <MenuItem disabled><em>Specific Game:</em></MenuItem>
                {gameList.map((game) => (
                  <MenuItem key={game} value={game}>{game}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField 
              label="Search Player" 
              variant="outlined" 
              size="small"
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              sx={{ minWidth: 250 }}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Filter Categories:</Typography>
              <ToggleButtonGroup
                value={visibleCategories}
                onChange={handleCategoryChange}
                aria-label="stat categories"
                size="small"
              >
                <ToggleButton value="Offensive" aria-label="offensive">
                  Offensive
                </ToggleButton>
                <ToggleButton value="Defensive" aria-label="defensive">
                  Defensive
                </ToggleButton>
                <ToggleButton value="Penalties" aria-label="penalties">
                  Penalties
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
          
          <SortableTable 
            columns={displayPlayerColumns} 
            data={filteredPlayerData} 
            categories={STAT_CATEGORIES}
            renderCell={(col, row) => {
              if (col.key === 'name') {
                return (
                  <Link href={`/stats/${slugify(row[col.dataIndex])}`} passHref legacyBehavior>
                    <MuiLink underline="hover">{row[col.dataIndex]}</MuiLink>
                  </Link>
                )
              }
              if (col.key === 'game') {
                return (
                  <Link href={`/stats/game/${slugify(row[col.dataIndex])}`} passHref legacyBehavior>
                    <MuiLink underline="hover">{row[col.dataIndex]}</MuiLink>
                  </Link>
                )
              }
              return row[col.dataIndex]
            }}
          />
        </Box>
      )}

      {activeTab === 1 && (
        <SortableTable columns={teamColumns} data={teamData} categories={TEAM_STAT_CATEGORIES} />
      )}
    </Box>
  )
}