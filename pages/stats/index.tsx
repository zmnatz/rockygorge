import stats from '@/data/stats/stats.yml'
import { 
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Select, MenuItem, FormControl, InputLabel, Box, Tabs, Tab, TableSortLabel, 
  TextField, Link as MuiLink, ToggleButton, ToggleButtonGroup, Typography
} from '@mui/material'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { STAT_CATEGORIES, TEAM_STAT_CATEGORIES, formatColumnTitle, aggregatePlayerStats, getSortableName } from '@/utils/stats'
import { slugify } from '@/utils/slugify'

function SortableTable({ columns, data, isTeamStats = false }: { columns: any[], data: any[], isTeamStats?: boolean }) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: columns[0]?.key || '',
    direction: 'asc',
  })

  const handleRequestSort = (property: string) => {
    const isAsc = sortConfig.key === property && sortConfig.direction === 'asc'
    setSortConfig({ key: property, direction: isAsc ? 'desc' : 'asc' })
  }

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      if (sortConfig.key === 'name') {
        aValue = getSortableName(aValue as string)
        bValue = getSortableName(bValue as string)
      }

      if (aValue === bValue) return 0
      const comparison = aValue < bValue ? -1 : 1
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortConfig])

  const columnGroups = useMemo(() => {
    const groups: { title: string; colSpan: number }[] = []
    
    // Always show Opponent/Player as the first group
    const baseCols = columns.filter(c => c.key === 'game' || c.key === 'name')
    if (baseCols.length > 0) {
      groups.push({ title: '', colSpan: baseCols.length })
    }

    const categories = isTeamStats ? TEAM_STAT_CATEGORIES : STAT_CATEGORIES

    Object.entries(categories).forEach(([category, fields]) => {
      const count = columns.filter(c => fields.includes(c.key)).length
      if (count > 0) {
        groups.push({ title: category, colSpan: count })
      }
    })

    return groups
  }, [columns, isTeamStats])

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          {columnGroups && (
            <TableRow>
              {columnGroups.map((group, idx) => (
                <TableCell 
                  key={idx} 
                  align="center" 
                  colSpan={group.colSpan}
                  sx={{ borderBottom: group.title ? '1px solid rgba(224, 224, 224, 1)' : 'none', fontWeight: 'bold' }}
                >
                  {group.title}
                </TableCell>
              ))}
            </TableRow>
          )}
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key} sx={{ minWidth: col.minWidth }}>
                <TableSortLabel
                  active={sortConfig.key === col.key}
                  direction={sortConfig.key === col.key ? sortConfig.direction : 'asc'}
                  onClick={() => handleRequestSort(col.key)}
                >
                  {col.title}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.map((row) => (
            <TableRow key={row.key}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.key === 'name' ? (
                    <Link href={`/stats/${slugify(row[col.dataIndex])}`} passHref legacyBehavior>
                      <MuiLink underline="hover">{row[col.dataIndex]}</MuiLink>
                    </Link>
                  ) : col.key === 'game' ? (
                    <Link href={`/stats/game/${slugify(row[col.dataIndex])}`} passHref legacyBehavior>
                      <MuiLink underline="hover">{row[col.dataIndex]}</MuiLink>
                    </Link>
                  ) : (
                    row[col.dataIndex]
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

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
          
          <SortableTable columns={displayPlayerColumns} data={filteredPlayerData} />
        </Box>
      )}

      {activeTab === 1 && (
        <SortableTable columns={teamColumns} data={teamData} isTeamStats />
      )}
    </Box>
  )
}