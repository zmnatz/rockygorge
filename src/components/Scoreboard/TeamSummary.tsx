import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Crest } from '@/components/Crest';
import type { CapitalFixture } from '@/api/capital';
import {
  formatPct,
  formatStreak,
  lastFive,
  outcomeOf,
  teamAbbreviation,
  teamCrest,
  teamRecord,
  teamStreak,
  winPct,
} from '@/utils/scoreboard';

function fullDate(dateTime: string): string {
  return new Date(dateTime).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// ESPN team-page header for the selected team: crest, record, streak, form
// plus the last result and next fixture in the current filter scope.
export function TeamSummary({
  team,
  results,
  upcoming,
  fixtures,
}: {
  team: string;
  results: CapitalFixture[];
  upcoming: CapitalFixture[];
  fixtures: CapitalFixture[];
}) {
  const record = teamRecord(results, team);
  const streak = teamStreak(results, team);
  const form = lastFive(results, team);
  const crest = teamCrest(fixtures, team);
  const last = results[0];
  const next = upcoming[0];

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        flexWrap: 'wrap',
        p: 2,
        mb: 3,
        borderLeft: 4,
        borderLeftColor: 'primary.main',
      }}
    >
      {crest ? (
        <Crest src={crest} alt={team} size="lg" name={team} />
      ) : (
        <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
          {teamAbbreviation(team)}
        </Avatar>
      )}
      <Box sx={{ minWidth: 0, flex: '1 1 200px' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }} noWrap>
          {team}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {record.won}-{record.lost}
          {record.drawn > 0 ? `-${record.drawn}` : ''} • {formatPct(winPct(record))}{' '}
          • PF {record.pointsFor} / PA {record.pointsAgainst}
        </Typography>
        {form.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }} aria-label="Recent form">
            {form.map((outcome, index) => (
              <Chip
                // Form entries have no stable id; position in the five-game
                // window is the identity.
                // biome-ignore lint/suspicious/noArrayIndexKey: form order is the identity
                key={index}
                label={outcome}
                size="small"
                color={outcome === 'W' ? 'success' : outcome === 'L' ? 'error' : 'default'}
                sx={{ minWidth: 0, '& .MuiChip-label': { px: 1 } }}
              />
            ))}
          </Box>
        )}
      </Box>
      <Box sx={{ flex: '1 1 220px' }}>
        {last ? (
          <Typography variant="body2">
            <Box component="span" sx={{ fontWeight: 'bold' }}>
              Last:{' '}
            </Box>
            {outcomeOf(last, team) === 'W' ? 'W' : outcomeOf(last, team) === 'L' ? 'L' : 'D'}{' '}
            {last.homeTeam.name === team
              ? `${last.homeTeam.score}-${last.awayTeam.score} vs ${last.awayTeam.name}`
              : `${last.awayTeam.score}-${last.homeTeam.score} @ ${last.homeTeam.name}`}{' '}
            <Typography component="span" variant="caption" color="text.secondary">
              • {fullDate(last.dateTime)}
            </Typography>
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No results in this scope yet.
          </Typography>
        )}
        {next && (
          <Typography variant="body2">
            <Box component="span" sx={{ fontWeight: 'bold' }}>
              Next:{' '}
            </Box>
            {next.homeTeam.name === team
              ? `vs ${next.awayTeam.name}`
              : `@ ${next.homeTeam.name}`}{' '}
            <Typography component="span" variant="caption" color="text.secondary">
              • {fullDate(next.dateTime)}
            </Typography>
          </Typography>
        )}
      </Box>
      {streak && (
        <Chip
          label={`Streak ${formatStreak(streak)}`}
          color={streak.code === 'W' ? 'success' : streak.code === 'L' ? 'error' : 'default'}
        />
      )}
    </Paper>
  );
}
