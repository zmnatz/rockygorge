import { 
  Box, Typography, Breadcrumbs, Link as MuiLink,
  ToggleButton, ToggleButtonGroup, Grid, Paper
} from '@mui/material'
import { useState, useMemo, type ReactNode } from 'react'
import Link from 'next/link'
import { loadStatsFromCsv } from '@/utils/loadStats'
import { STAT_CATEGORIES, formatColumnTitle, aggregatePlayerStats } from '@/utils/stats'
import { slugify } from '@/utils/slugify'
import { SortableTable } from '@/components/SortableTable'

export async function getStaticPaths() {
  const stats = loadStatsFromCsv()
  const games = Array.isArray(stats.games) ? stats.games : []
  const allPlayerNames: string[] = Array.from(new Set(games.flatMap(game => 
    Array.isArray(game.players) ? game.players.map(player => player.name as string) : []
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
  const stats = loadStatsFromCsv()
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
        key: `${game.team}-${game.opponent}-${realName}`,
        opponent: game.opponent,
        team: game.team,
        division: game.division,
        date: game.date,
        season: game.season,
        ...playerStats
      }]
    }
    return []
  })

  const firstPlayerStats = playerLogs[0] || {}
  const statKeys = Object.values(STAT_CATEGORIES).flat()
  const allColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date', minWidth: 100 },
    { title: 'Division', dataIndex: 'division', key: 'division', minWidth: 80 },
    { title: 'Opponent', dataIndex: 'opponent', key: 'opponent', minWidth: 150 },
    ...statKeys.filter(key => Object.prototype.hasOwnProperty.call(firstPlayerStats, key) && key !== 'name').map((key) => ({
      title: formatColumnTitle(key), dataIndex: key, key,
    })),
    ...Object.keys(firstPlayerStats).filter((key) => key !== 'name' && key !== 'opponent' && key !== 'game' && key !== 'key' && key !== 'season' && key !== 'date' && key !== 'division' && !statKeys.includes(key)).map((key) => ({
      title: formatColumnTitle(key), dataIndex: key, key,
    })),
  ]

  const aggregatedStats = aggregatePlayerStats(playerLogs)[0] || {}

  return { props: { playerName: realName, playerLogs, allColumns, aggregatedStats } }
}

export default function PlayerStatsPage({ playerName, playerLogs, allColumns, aggregatedStats }) {
  const [visibleCategories, setVisibleCategories] = useState<string[]>(['Offensive', 'Defensive', 'Penalties'])

  const handleCategoryChange = (
    _event: React.MouseEvent<HTMLElement>,
    newCategories: string[],
  ) => {
    if (newCategories.length) {
      setVisibleCategories(newCategories)
    }
  }

  const filteredColumns = useMemo(() => {
    return allColumns.filter(col => {
      if (col.key === 'opponent' || col.key === 'game' || col.key === 'name' || col.key === 'date' || col.key === 'division') return true
      return Object.entries(STAT_CATEGORIES).some(([category, fields]) => 
        visibleCategories.includes(category) && fields.includes(col.key)
      )
    })
  }, [allColumns, visibleCategories])

  const logsBySeason = useMemo(() => {
    const grouped: Record<string, typeof playerLogs> = {}
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
        <Link href="/stats">
          {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
          }
          <MuiLink underline="hover" color="inherit">
            Stats
          </MuiLink>
        </Link>
        <Typography color="text.primary">{playerName}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom>{playerName} - Game Logs</Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>Career / Season Totals</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.entries(STAT_CATEGORIES).map(([category, fields]) => (
          <Grid size={{ xs: 12, md: 4 }} key={category}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="primary">{category}</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {fields.map(key => {
                  const value = aggregatedStats[key]
                  if (value === undefined || value === null) return null
                  return (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', pb: 0.5 }} key={key}>
                      <Typography variant="body2" color="text.secondary">{formatColumnTitle(key)}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{String(value)}</Typography>
                    </Box>
                  )
                })}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

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
          <SortableTable 
            columns={filteredColumns} 
            data={logs} 
            categories={STAT_CATEGORIES}
            baseColumnFilter={(c) => c.key === 'opponent' || c.key === 'game' || c.key === 'division' || c.key === 'date' || c.key === 'name'}
            renderCell={(col, row) => {
              if (col.key === 'opponent' || col.key === 'game') {
                return (
                  <Link
                    href={`/stats/game/${slugify(`${String(row.team ?? 'Rocky Gorge D1')}-${String(row[col.dataIndex] ?? '')}`)}`}>
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
      ))}
    </Box>
  );
}
