import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import type { LeadersDivision } from '@/utils/leaders';
import {
  coverageNote,
  formatMadeOf,
  type LeaderSortKey,
  sortPlayers,
} from '@/utils/leadersView';

const PAGE_SIZE = 25;
const COLLAPSIBLE_SX = { display: { xs: 'none', md: 'table-cell' } };

const SORTABLE: { key: LeaderSortKey; label: string; collapsible?: boolean }[] = [
  { key: 'tries', label: 'Tries' },
  { key: 'conversions', label: 'Conversions', collapsible: true },
  { key: 'penaltyGoals', label: 'Penalty goals', collapsible: true },
  { key: 'points', label: 'Points' },
];

// Player scoring leaders for one division. Players are team + name only (the
// CMS has no player id), so rows aren't linked to player pages.
export function LeadersTable({
  division,
  selectedTeamNames,
}: {
  division: LeadersDivision;
  selectedTeamNames: string[];
}) {
  const [sortKey, setSortKey] = useState<LeaderSortKey>('points');
  const [showAll, setShowAll] = useState(false);
  const sorted = sortPlayers(division.players, sortKey);
  const rows = showAll ? sorted : sorted.slice(0, PAGE_SIZE);

  return (
    <Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" aria-label={`${division.compName} scoring leaders`}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Player</TableCell>
              <TableCell sx={{ fontWeight: 'bold', ...COLLAPSIBLE_SX }}>Team</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Games
              </TableCell>
              {SORTABLE.map(({ key, label, collapsible }) => (
                <TableCell
                  key={key}
                  align="right"
                  sortDirection={sortKey === key ? 'desc' : false}
                  sx={{ fontWeight: 'bold', ...(collapsible ? COLLAPSIBLE_SX : {}) }}
                >
                  <TableSortLabel
                    active={sortKey === key}
                    direction="desc"
                    onClick={() => setSortKey(key)}
                  >
                    {label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell align="right" sx={{ fontWeight: 'bold', ...COLLAPSIBLE_SX }}>
                Drop goals
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((player, index) => {
              const selected = selectedTeamNames.includes(player.team);
              return (
                <TableRow
                  key={`${player.team}|${player.name}`}
                  selected={selected}
                  sx={
                    selected
                      ? { bgcolor: 'primary.light', '& .MuiTableCell-root': { fontWeight: 'bold' } }
                      : undefined
                  }
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{player.name}</Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: { xs: 'block', md: 'none' } }}
                    >
                      {player.team}
                    </Typography>
                  </TableCell>
                  <TableCell sx={COLLAPSIBLE_SX}>{player.team}</TableCell>
                  <TableCell align="right">{player.games}</TableCell>
                  <TableCell align="right">{player.tries}</TableCell>
                  <TableCell align="right" sx={COLLAPSIBLE_SX}>
                    {formatMadeOf(player.conversions, player.conversionAttempts)}
                  </TableCell>
                  <TableCell align="right" sx={COLLAPSIBLE_SX}>
                    {formatMadeOf(player.penaltyGoals, player.penaltyGoalAttempts)}
                  </TableCell>
                  <TableCell align="right">{player.points}</TableCell>
                  <TableCell align="right" sx={COLLAPSIBLE_SX}>
                    {player.dropGoals}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {sorted.length > PAGE_SIZE && (
        <Button size="small" sx={{ mt: 1 }} onClick={() => setShowAll((value) => !value)}>
          {showAll ? `Show top ${PAGE_SIZE}` : `Show all ${sorted.length} players`}
        </Button>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        {coverageNote(division)} Conversions and penalty goals show made/attempted.
        Games counts matches the player was named in the squad. Points: try 5, conversion 2, penalty goal 3, drop goal 3. Players are
        matched by team and name.
      </Typography>
    </Box>
  );
}
