import NextLink from 'next/link';
import { useState } from 'react';
import MuiLink from '@mui/material/Link';
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
import { Crest } from '@/components/Crest';
import type { CapitalFixture } from '@/api/capital';
import type { LeadersDivision } from '@/utils/leaders';
import { teamCrest } from '@/utils/scoreboard';
import {
  coverageNote,
  playersOfTeams,
  type LeaderSortKey,
  sortPlayers,
} from '@/utils/leadersView';

const PAGE_SIZE = 25;
const COLLAPSIBLE_SX = { display: { xs: 'none', md: 'table-cell' } };

// A team links to its view on the standings page for the same season and
// division.
function teamHref(team: string, season: string, compId: string) {
  return { pathname: '/standings', query: { tab: 'standings', season, comp: compId, team } };
}

const SORTABLE: { key: LeaderSortKey; label: string; collapsible?: boolean }[] = [
  { key: 'tries', label: 'Tries' },
  { key: 'conversions', label: 'Conversions', collapsible: true },
  { key: 'penaltyGoals', label: 'Penalty goals', collapsible: true },
  { key: 'points', label: 'Points' },
];

// Player scoring leaders for one division. The commentary names scorers
// without an id, so each is matched to the match lineup by team + name; the
// lineup's player id (when the snapshot has one) links to the player page.
export function LeadersTable({
  division,
  season,
  selectedTeamNames,
  fixtures,
  onSelectTeam,
}: {
  division: LeadersDivision;
  season: string;
  selectedTeamNames: string[];
  /** The division's fixtures, the source of team crests. */
  fixtures: CapitalFixture[];
  onSelectTeam: (team: string) => void;
}) {
  const [sortKey, setSortKey] = useState<LeaderSortKey>('points');
  const [showAll, setShowAll] = useState(false);
  const teamLink = (team: string, variant: 'body2' | 'caption', color: string) => (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <Crest src={teamCrest(fixtures, team)} alt="" name={team} />
      <MuiLink
        component={NextLink}
        href={teamHref(team, season, division.compId)}
        // Already on this page, so the filters change in place; a modified
        // click still opens the link normally.
        onClick={(event: React.MouseEvent) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          onSelectTeam(team);
        }}
        underline="hover"
        color={color}
        variant={variant}
      >
        {team}
      </MuiLink>
    </Box>
  );
  const players = playersOfTeams(division.players, selectedTeamNames);
  const sorted = sortPlayers(players, sortKey);
  const rows = showAll ? sorted : sorted.slice(0, PAGE_SIZE);

  return (
    <Box>
      {players.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No scoring leaders for the selected team in this division.
        </Typography>
      )}
      {players.length > 0 && (
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
              return (
                <TableRow key={`${player.team}|${player.playerId || player.name}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {/* Snapshots built before ids were recorded have none. */}
                    {player.playerId ? (
                      <MuiLink
                        component={NextLink}
                        href={`/player?id=${encodeURIComponent(player.playerId)}`}
                        underline="hover"
                        color="inherit"
                        variant="body2"
                      >
                        {player.name}
                      </MuiLink>
                    ) : (
                      <Typography variant="body2">{player.name}</Typography>
                    )}
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                      {teamLink(player.team, 'caption', 'text.secondary')}
                    </Box>
                  </TableCell>
                  <TableCell sx={COLLAPSIBLE_SX}>
                    {teamLink(player.team, 'body2', 'inherit')}
                  </TableCell>
                  <TableCell align="right">{player.games}</TableCell>
                  <TableCell align="right">{player.tries}</TableCell>
                  <TableCell align="right" sx={COLLAPSIBLE_SX}>
                    {player.conversions}
                  </TableCell>
                  <TableCell align="right" sx={COLLAPSIBLE_SX}>
                    {player.penaltyGoals}
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
      )}
      {sorted.length > PAGE_SIZE && (
        <Button size="small" sx={{ mt: 1 }} onClick={() => setShowAll((value) => !value)}>
          {showAll ? `Show top ${PAGE_SIZE}` : `Show all ${sorted.length} players`}
        </Button>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        {coverageNote(division)} Games counts matches the player was named in the squad. Points: try 5, conversion 2, penalty goal 3, drop goal 3. Players are
        matched by team and name.
      </Typography>
    </Box>
  );
}
