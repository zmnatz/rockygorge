import stats from '@/data/stats/stats.yml'
import { 
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Box, TableSortLabel, Typography, Breadcrumbs, Link as MuiLink,
  ToggleButton, ToggleButtonGroup, Grid
} from '@mui/material'
import { useState, useMemo } from 'react'
import Link from 'next/link'

const STAT_CATEGORIES: Record<string, string[]> = {
  Offensive: ['tries_scored', 'try_assists', 'positive_carries', 'negative_carries', 'line_breaks', 'attacking_rucks', 'tackle_breaks', 'off_loads'],
  Defensive: ['tackles_made', 'tackles_missed', 'dominant_tackles', 'steals', 'defensive_rucks', 'turnovers_forced'],
  Penalties: ['penalties_conceded', 'penalty_reasons', 'turnovers_given']
}

function formatColumnTitle(key: string) {
  if (key === 'name') return 'Player'
  if (key === 'game') return 'Opponent'
  return key.replace(/_/g, ' ').split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

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
        const getSortableName = (name: string) => {
          const parts = name.trim().split(/\s+/)
          const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0]
          const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : ''
          return `${lastName}, ${firstName}`.toLowerCase()
        }
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
    
    const baseCols = columns.filter(c => c.key === 'name')
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
            <TableRow key={row.name}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.key === 'name' ? (
                    <Link href={`/stats/${slugify(row[col.dataIndex])}`} passHref legacyBehavior>
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
  return {
    paths: games.map((game) => ({
      params: { gameId: slugify(game.opponent) },
    })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const { gameId } = params
  const games = Array.isArray(stats.games) ? stats.games : []
  const game = games.find(g => slugify(g.opponent) === gameId)

  if (!game) return { notFound: true }

  const playerStats = game.players || []
  const firstPlayer = playerStats[0] || {}
  const allColumns = [
    { title: 'Player', dataIndex: 'name', key: 'name', minWidth: 200 },
    ...Object.keys(firstPlayer).filter((key) => key !== 'name' && key !== 'game').map((key) => ({
      title: formatColumnTitle(key), dataIndex: key, key,
    })),
  ]

  return { props: { game, allColumns } }
}

const TEAM_STAT_CATEGORIES: Record<string, string[]> = {
  Offensive: ['ruckable_carries', 'ruck_arrivals', 'avg_players_committed_to_ruck', 'maul_success', 'lineouts_won', 'scrums_won'],
  Defensive: ['total_tackles_made', 'total_tackles_missed', 'tackle_percentage', 'double_tackles', 'lineouts_stolen', 'scrums_stolen'],
  Penalties: ['total_penalties_gorge', 'total_penalties_opponent', 'total_knocks_gorge', 'total_knocks_opponent', 'lineouts_lost', 'scrums_lost']
}

export default function GameStatsPage({ game, allColumns }) {
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
      if (col.key === 'name') return true
      return Object.entries(STAT_CATEGORIES).some(([category, fields]) => 
        visibleCategories.includes(category) && fields.includes(col.key)
      )
    })
  }, [allColumns, visibleCategories])

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link href="/stats" passHref legacyBehavior>
          <MuiLink underline="hover" color="inherit">
            Stats
          </MuiLink>
        </Link>
        <Typography color="text.secondary">Season: {game.season}</Typography>
        <Typography color="text.primary">{game.opponent}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Game Stats: {game.opponent}</Typography>
        <Typography variant="h6" color="text.secondary">Season: {game.season}</Typography>
      </Box>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Team Performance</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.entries(TEAM_STAT_CATEGORIES).map(([category, fields]) => (
          <Grid size={{ xs: 12, md: 4 }} key={category}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="primary">{category}</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {fields.map(key => {
                  const value = game.team_stats[key]
                  if (value === undefined) return null
                  return (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', pb: 0.5 }} key={key}>
                      <Typography variant="body2" color="text.secondary">{formatColumnTitle(key)}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{value as string}</Typography>
                    </Box>
                  )
                })}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" gutterBottom>Player Statistics</Typography>
      <Box sx={{ mb: 2 }}>
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
      
      <SortableTable columns={filteredColumns} data={game.players} />
    </Box>
  )
}
