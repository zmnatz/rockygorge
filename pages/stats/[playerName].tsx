import stats from '@/data/stats/stats.yml'
import { 
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Box, TableSortLabel, Typography, Breadcrumbs, Link as MuiLink,
  ToggleButton, ToggleButtonGroup
} from '@mui/material'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { STAT_CATEGORIES, formatColumnTitle, getSortableName } from '@/utils/stats'
import { slugify } from '@/utils/slugify'

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

  // Group columns by their category for the multi-level header
  const columnGroups = useMemo(() => {
    const groups: { title: string; colSpan: number }[] = []
    
    // Always show Opponent/Game as the first group
    const baseCols = columns.filter(c => c.key === 'game' || c.key === 'name')
    if (baseCols.length > 0) {
      groups.push({ title: '', colSpan: baseCols.length })
    }

    Object.entries(STAT_CATEGORIES).forEach(([category, fields]) => {
      const count = columns.filter(c => fields.includes(c.key)).length
      if (count > 0) {
        groups.push({ title: category, colSpan: count })
      }
    })

    return groups
  }, [columns])

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
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
                  {col.key === 'game' ? (
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

export async function getStaticPaths() {
  const games = Array.isArray(stats.games) ? stats.games : []
  const allPlayerNames: string[] = Array.from(new Set(games.flatMap(game => 
    Array.isArray(game.players) ? (game.players as any[]).map(player => player.name as string) : []
  )))

  return {
    paths: allPlayerNames.map((name) => ({
      params: { playerName: slugify(name) },
    })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const { playerName } = params
  const games = Array.isArray(stats.games) ? stats.games : []
  
  // Find the real name from the slug
  let realName = ''
  for (const game of games) {
    const player = game.players.find(p => slugify(p.name) === playerName)
    if (player) {
      realName = player.name
      break
    }
  }

  const playerLogs = games.flatMap((game) => {
    const playerStats = game.players.find(p => p.name === realName)
    if (playerStats) {
      return [{
        key: `${game.opponent}-${realName}`,
        game: game.opponent,
        season: game.season,
        ...playerStats
      }]
    }
    return []
  })

  const firstPlayerStats = playerLogs[0] || {}
  const allColumns = [
    { title: 'Opponent', dataIndex: 'game', key: 'game', minWidth: 150 },
    ...Object.keys(firstPlayerStats).filter((key) => key !== 'name' && key !== 'game' && key !== 'key' && key !== 'season').map((key) => ({
      title: formatColumnTitle(key), dataIndex: key, key,
    })),
  ]

  return { props: { playerName: realName, playerLogs, allColumns } }
}

export default function PlayerStatsPage({ playerName, playerLogs, allColumns }) {
  const [visibleCategories, setVisibleCategories] = useState<string[]>(['Offensive', 'Defensive', 'Penalties'])

  const handleCategoryChange = (
    event: React.MouseEvent<HTMLElement>,
    newCategories: string[],
  ) => {
    if (newCategories.length) {
      setVisibleCategories(newCategories)
    }
  }

  const filteredColumns = useMemo(() => {
    return allColumns.filter(col => {
      if (col.key === 'game' || col.key === 'name') return true
      return Object.entries(STAT_CATEGORIES).some(([category, fields]) => 
        visibleCategories.includes(category) && fields.includes(col.key)
      )
    })
  }, [allColumns, visibleCategories])

  const logsBySeason = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    playerLogs.forEach(log => {
      const season = log.season || 'Unknown'
      if (!grouped[season]) grouped[season] = []
      grouped[season].push(log)
    })
    // Sort seasons descending
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]))
  }, [playerLogs])

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link href="/stats" passHref legacyBehavior>
          <MuiLink underline="hover" color="inherit">
            Stats
          </MuiLink>
        </Link>
        <Typography color="text.primary">{playerName}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom>{playerName} - Game Logs</Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Filter Categories:</Typography>
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
      
      {logsBySeason.map(([season, logs]) => (
        <Box key={season} sx={{ mb: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ borderBottom: '2px solid', borderColor: 'primary.main', display: 'inline-block', pb: 0.5 }}>
            Season: {season}
          </Typography>
          <SortableTable columns={filteredColumns} data={logs} />
        </Box>
      ))}
    </Box>
  )
}
