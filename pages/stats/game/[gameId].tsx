import stats from '@content/stats/stats.yml'
import { 
  Paper, Box, Typography, Breadcrumbs, Link as MuiLink,
  ToggleButton, ToggleButtonGroup, Grid
} from '@mui/material'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { STAT_CATEGORIES, TEAM_STAT_CATEGORIES, formatColumnTitle } from '@/utils/stats'
import { slugify } from '@/utils/slugify'
import { SortableTable } from '@/components/SortableTable'

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
      
      <SortableTable 
        columns={filteredColumns} 
        data={game.players} 
        categories={STAT_CATEGORIES}
        baseColumnFilter={(c) => c.key === 'name'}
        rowKey={(row) => row.name}
        renderCell={(col, row) => {
          if (col.key === 'name') {
            return (
              <Link href={`/stats/${slugify(row[col.dataIndex])}`} passHref legacyBehavior>
                <MuiLink underline="hover">{row[col.dataIndex]}</MuiLink>
              </Link>
            )
          }
          return row[col.dataIndex]
        }}
      />
    </Box>
  )
}
