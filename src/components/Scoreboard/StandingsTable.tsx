import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Crest } from '@/components/Crest';
import type { CapitalFixture, LadderPool } from '@/api/capital';
import { formatPct, formatStreak, teamCrest, teamStreak, winPct } from '@/utils/scoreboard';

// Secondary columns collapse on small screens, ESPN mobile style.
const COLLAPSIBLE_SX = { display: { xs: 'none', md: 'table-cell' } };

function isRockyGorge(name: string): boolean {
  return name.toLowerCase().includes('rocky gorge');
}

function streakColor(code: string): string {
  if (code === 'W') {
    return 'success.main';
  }
  if (code === 'L') {
    return 'error.main';
  }
  return 'text.primary';
}

// NFL-style standings table: W L D PCT PF PA +/- BP PTS STRK. Streaks are
// derived from the division's fixtures since the CMS ladder omits them.
export function StandingsTable({
  pool,
  selectedTeamNames,
  fixtures,
}: {
  pool: LadderPool;
  selectedTeamNames: string[];
  fixtures: CapitalFixture[];
}) {
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
        {pool.poolName} ({pool.teams.length} {pool.teams.length === 1 ? 'team' : 'teams'})
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" aria-label={`${pool.poolName} standings`}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Team</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>W</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>L</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>D</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>PCT</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', ...COLLAPSIBLE_SX }}>PF</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', ...COLLAPSIBLE_SX }}>PA</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', ...COLLAPSIBLE_SX }}>+/-</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>BP</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>PTS</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>STRK</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pool.teams.map((row) => {
              const selected = selectedTeamNames.includes(row.name);
              const gorge = isRockyGorge(row.name);
              const pct = formatPct(
                winPct({
                  played: row.matchesPlayed,
                  won: row.matchesWon,
                  drawn: row.matchesDrawn,
                })
              );
              const streak = teamStreak(fixtures, row.name);
              // Prefer the division's fixture crest (backfilled across feeds)
              // over the ladder's, so the table matches the scoreboards.
              const crest = teamCrest(fixtures, row.name) || row.crest;
              return (
                <TableRow
                  key={row.id}
                  selected={selected}
                  sx={
                    selected || gorge
                      ? {
                          bgcolor: selected ? 'primary.light' : 'action.hover',
                          '& .MuiTableCell-root': { fontWeight: 'bold' },
                        }
                      : undefined
                  }
                >
                  <TableCell>{row.position}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Crest src={crest} alt="" name={row.name} />
                      <Typography variant="body2" noWrap>
                        {row.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{row.matchesWon}</TableCell>
                  <TableCell align="right">{row.matchesLost}</TableCell>
                  <TableCell align="right">{row.matchesDrawn}</TableCell>
                  <TableCell align="right">{pct}</TableCell>
                  <TableCell align="right" sx={COLLAPSIBLE_SX}>{row.pointsFor}</TableCell>
                  <TableCell align="right" sx={COLLAPSIBLE_SX}>{row.pointsAgainst}</TableCell>
                  <TableCell align="right" sx={COLLAPSIBLE_SX}>
                    {row.pointsDifference > 0
                      ? `+${row.pointsDifference}`
                      : row.pointsDifference}
                  </TableCell>
                  <TableCell align="right">{row.totalBonusPoints}</TableCell>
                  <TableCell align="right">{row.totalMatchPoints}</TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: streak ? streakColor(streak.code) : undefined }}
                  >
                    {formatStreak(streak)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
