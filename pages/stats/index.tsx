import stats from '@/data/stats/stats.yml'
import { 
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Select, MenuItem, FormControl, InputLabel, Box, Tabs, Tab, TableSortLabel, 
  TextField // 1. Added TextField import
} from '@mui/material'
import { useState, useMemo } from 'react'

// ... (formatColumnTitle and aggregatePlayerStats functions remain the same as previous response)
function formatColumnTitle(key: string) {
  if (key === 'name') return 'Player'
  return key.replace(/_/g, ' ').split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function aggregatePlayerStats(playerDataByGame: any[]) {
  const aggregated: Record<string, any> = {}
  playerDataByGame.forEach((row) => {
    const playerName = row.name
    if (!aggregated[playerName]) aggregated[playerName] = { name: playerName }
    Object.keys(row).forEach((key) => {
      if (key !== 'name' && key !== 'game' && key !== 'key') {
        const value = row[key]
        if (typeof value === 'number') {
          aggregated[playerName][key] = (aggregated[playerName][key] || 0) + value
        } else if (typeof value === 'string' && !isNaN(Number(value))) {
          aggregated[playerName][key] = (aggregated[playerName][key] || 0) + parseFloat(value)
        } else {
          aggregated[playerName][key] = value
        }
      }
    })
  })
  return Object.values(aggregated).map((player) => ({ key: `agg-${player.name}`, ...player }))
}

function SortableTable({ columns, data }: { columns: any[], data: any[] }) {
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
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      if (aValue === bValue) return 0
      const comparison = aValue < bValue ? -1 : 1
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortConfig])

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key}>
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
                <TableCell key={col.key}>{row[col.dataIndex]}</TableCell>
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
    { title: 'Player', dataIndex: 'name', key: 'name' },
    ...Object.keys(firstPlayer).filter((key) => key !== 'name').map((key) => ({
      title: formatColumnTitle(key), dataIndex: key, key,
    })),
  ]
  const playerDataByGame = games.flatMap((game) =>
    Array.isArray(game.players) ? game.players.map((player) => ({
      key: `${game.opponent}-${player.name}`, game: game.opponent, ...player,
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
  const [selectedGame, setSelectedGame] = useState('')
  const [playerSearch, setPlayerSearch] = useState('') // 2. State for text search

  const displayPlayerColumns = useMemo(() => {
    return playerColumns.filter((col) => col.key !== 'game')
  }, [playerColumns])

  // 3. Updated useMemo to handle BOTH game selection AND text search
  const filteredPlayerData = useMemo(() => {
    // Step A: Filter by Game or Aggregate
    let data = selectedGame 
      ? playerDataByGame.filter((row) => row.game === selectedGame)
      : aggregatePlayerStats(playerDataByGame)

    // Step B: Filter by Player Name (Case Insensitive)
    if (playerSearch) {
      const searchLower = playerSearch.toLowerCase()
      data = data.filter((player) => 
        player.name?.toLowerCase().includes(searchLower)
      )
    }

    return data
  }, [playerDataByGame, selectedGame, playerSearch])

  return (
    <Box sx={{ width: '100%', p: 2 }}>
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
          {/* 4. Filter Row: Game Select and Text Search side-by-side */}
          <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Game</InputLabel>
              <Select 
                value={selectedGame} 
                onChange={(e) => setSelectedGame(e.target.value)} 
                label="Filter by Game"
              >
                <MenuItem value=""><em>All Games (Aggregated)</em></MenuItem>
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
          </Box>
          
          <SortableTable columns={displayPlayerColumns} data={filteredPlayerData} />
        </Box>
      )}

      {activeTab === 1 && (
        <SortableTable columns={teamColumns} data={teamData} />
      )}
    </Box>
  )
}