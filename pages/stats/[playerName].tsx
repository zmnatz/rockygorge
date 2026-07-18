import stats from '@/data/stats/stats.yml'
import { 
  Box, Typography, Breadcrumbs, Link as MuiLink,
  ToggleButton, ToggleButtonGroup
} from '@mui/material'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { STAT_CATEGORIES, formatColumnTitle } from '@/utils/stats'
import { slugify } from '@/utils/slugify'
import { SortableTable } from '@/components/SortableTable'

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
          <SortableTable 
            columns={filteredColumns} 
            data={logs} 
            categories={STAT_CATEGORIES}
            renderCell={(col, row) => {
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
      ))}
    </Box>
  )
}
