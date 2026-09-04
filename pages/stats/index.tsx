import { 
  Select, MenuItem, FormControl, InputLabel, Box, Tabs, Tab, 
  TextField, Link as MuiLink, ToggleButton, ToggleButtonGroup, Typography
} from '@mui/material'
import { useState, useMemo, type ReactNode } from 'react'
import Link from 'next/link'
import { loadStatsFromCsv } from '@/utils/loadStats'
import { STAT_CATEGORIES, TEAM_STAT_CATEGORIES, formatColumnTitle, aggregatePlayerStats } from '@/utils/stats'
import { slugify } from '@/utils/slugify'
import { SortableTable } from '@/components/SortableTable'

export async function getStaticProps() {
  const stats = loadStatsFromCsv()
  const games = Array.isArray(stats.games) ? stats.games : []
  const firstPlayer = games?.[0]?.players?.[0] || {}
  const statKeys = Object.values(STAT_CATEGORIES).flat()
  const playerColumns = [
    { title: 'Player', dataIndex: 'name', key: 'name', minWidth: 200 },
    ...statKeys.filter(key => Object.prototype.hasOwnProperty.call(firstPlayer, key)).map((key) => ({
      title: formatColumnTitle(key), dataIndex: key, key,
    })),
    ...Object.keys(firstPlayer).filter((key) => key !== 'name' && key !== 'game' && !statKeys.includes(key)).map((key) => ({
      title: formatColumnTitle(key), dataIndex: key, key,
    })),
  ]
  const playerDataByGame = games.flatMap((game) =>
    Array.isArray(game.players) ? game.players.map((player) => ({
      key: `${game.team}-${game.opponent}-${player.name}`,
      game: game.game,
      division: game.division,
      date: game.date,
      season: game.season,
      ...player,
    })) : []
  )
  const gameList = games.map((game) => game.game)
  const teamStatKeys = Object.values(TEAM_STAT_CATEGORIES).flat()
  const firstTeamStats = games?.[0]?.team_stats || {}
  const teamColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Division', dataIndex: 'division', key: 'division' },
    { title: 'Opponent', dataIndex: 'opponent', key: 'opponent' },
    ...teamStatKeys.filter(key => Object.prototype.hasOwnProperty.call(firstTeamStats, key)).map((key) => ({
      title: formatColumnTitle(key), dataIndex: key, key,
    })),
    ...Object.keys(firstTeamStats).filter((key) => !teamStatKeys.includes(key)).map((key) => ({
      title: formatColumnTitle(key), dataIndex: key, key,
    })),
  ]
  const teamData = games.map((game) => ({
    key: `${game.team}-${game.opponent}`,
    date: game.date,
    division: game.division,
    opponent: game.opponent,
    team: game.team,
    ...game.team_stats,
  }))
  return { props: { playerColumns, playerDataByGame, gameList, teamColumns, teamData } }
}

export default function StatsPage({ playerColumns, playerDataByGame, gameList, teamColumns, teamData }) {
  const [activeTab, setActiveTab] = useState(0)
  const [selectedGame, setSelectedGame] = useState('') // '' = Aggregate, 'all_detailed' = Individual, 'OpponentName' = Filtered
  const [playerSearch, setPlayerSearch] = useState('')
  const [visibleCategories, setVisibleCategories] = useState<string[]>(['Offensive', 'Defensive', 'Penalties'])

  const handleCategoryChange = (
    _event: React.MouseEvent<HTMLElement>,
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
        { title: 'Date', dataIndex: 'date', key: 'date' },
        { title: 'Division', dataIndex: 'division', key: 'division' },
        { title: 'Opponent', dataIndex: 'game', key: 'game' },
        { title: 'Season', dataIndex: 'season', key: 'season' },
        ...playerColumns
      ]
    }

    return cols.filter(col => {
      if (col.key === 'game' || col.key === 'name' || col.key === 'season' || col.key === 'date' || col.key === 'division') return true
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
                  <Link href={`/stats/${slugify(String(row[col.dataIndex] ?? ''))}`}>
                    {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
                    }
                    <MuiLink underline="hover">{row[col.dataIndex] as ReactNode}</MuiLink>
                  </Link>
                );
              }
              if (col.key === 'game') {
                return (
                  <Link href={`/stats/game/${slugify(String(row[col.dataIndex] ?? ''))}`}>
                    {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
                    }
                    <MuiLink underline="hover">{row[col.dataIndex] as ReactNode}</MuiLink>
                  </Link>
                );
              }
              return row[col.dataIndex] as ReactNode
            }}
          />
        </Box>
      )}

      {activeTab === 1 && (
        <SortableTable 
          columns={teamColumns} 
          data={teamData} 
          categories={TEAM_STAT_CATEGORIES} 
          baseColumnFilter={(c) => c.key === 'opponent' || c.key === 'division' || c.key === 'date'}
          renderCell={(col, row) => {
            if (col.key === 'opponent') {
              return (
                <Link
                  href={`/stats/game/${slugify(`${String(row.team ?? '')}-${String(row.opponent ?? '')}`)}`}>
                  {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
                  }
                  <MuiLink underline="hover">{row[col.dataIndex] as ReactNode}</MuiLink>
                </Link>
              );
            }
            return row[col.dataIndex] as ReactNode
          }}
        />
      )}
    </Box>
  );
}