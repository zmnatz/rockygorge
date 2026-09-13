import { useState } from 'react';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useMatch } from '@/components/Scores/useMatch';
import { ScoreCard } from '@/components/Scores/ScoreCard';
import type { MatchCommentary, MatchPlayer, Team } from '@/types/match';

type EventFilter = 'all' | 'scores' | 'substitutions';
type TeamFilter = 'all' | 'home' | 'away';

export default function GamePage() {
  const router = useRouter();
  const { id } = router.query;
  const matchId = typeof id === 'string' ? id : undefined;

  const { data, isLoading, error } = useMatch(matchId);
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all');

  if (!matchId || isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <Typography variant="h6">Game not found or failed to load.</Typography>
      </Box>
    );
  }

  const { getFixtureItem: game, allMatchCommentary: events, allMatchStatsSummary: stats } = data;
  const lineup = sortByShirtNumber(stats?.lineUp?.players);
  const substitutes = sortByShirtNumber(stats?.lineUp?.substitutes);
  const coaches = stats?.lineUp?.coaches || [];
  const eventList = events || [];
  const scoreCount = eventList.filter((event) => isScoreEvent(event.type)).length;
  const substitutionCount = eventList.filter((event) =>
    isSubstitutionEvent(event.type)
  ).length;
  const visibleEvents = eventList.filter(
    (event) =>
      (eventFilter === 'all' ||
        (eventFilter === 'scores'
          ? isScoreEvent(event.type)
          : isSubstitutionEvent(event.type))) &&
      (teamFilter === 'all' ||
        (teamFilter === 'home' ? event.isHome : !event.isHome))
  );
  const cameOnNames = new Set(
    eventList.flatMap((event) => {
      const sub = isSubstitutionEvent(event.type)
        ? parseSubstitution(event.comment)
        : null;
      return sub ? [sub.on.toLowerCase()] : [];
    })
  );
  // Only dim unused substitutes when the feed actually contains substitution
  // data — otherwise every bench player would look like they didn't play.
  const substituteActiveNames = substitutionCount > 0 ? cameOnNames : undefined;

  return (
    <Box sx={{ py: 4, px: 2, maxWidth: { xs: 1100, lg: 1400, xl: 1800 }, mx: 'auto' }}>
      <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ mb: 2 }}>
            <ScoreCard score={game} large />
          </Box>
          <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TeamPanel
                team={game.homeTeam}
                isHome
                lineup={lineup}
                substitutes={substitutes}
                coaches={coaches}
                substituteActiveNames={substituteActiveNames}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TeamPanel
                team={game.awayTeam}
                isHome={false}
                lineup={lineup}
                substitutes={substitutes}
                coaches={coaches}
                substituteActiveNames={substituteActiveNames}
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            Match Events
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {eventList.length > 0 && (
            <>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`All (${eventList.length})`}
                  clickable
                  color={eventFilter === 'all' ? 'primary' : 'default'}
                  onClick={() => setEventFilter('all')}
                />
                <Chip
                  label={`Scores (${scoreCount})`}
                  clickable
                  color={eventFilter === 'scores' ? 'primary' : 'default'}
                  onClick={() => setEventFilter('scores')}
                />
                <Chip
                  label={`Substitutions (${substitutionCount})`}
                  clickable
                  color={eventFilter === 'substitutions' ? 'primary' : 'default'}
                  onClick={() => setEventFilter('substitutions')}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label="All teams"
                  clickable
                  color={teamFilter === 'all' ? 'primary' : 'default'}
                  onClick={() => setTeamFilter('all')}
                />
                <Chip
                  label={game.homeTeam.name}
                  clickable
                  color={teamFilter === 'home' ? 'primary' : 'default'}
                  onClick={() => setTeamFilter('home')}
                />
                <Chip
                  label={game.awayTeam.name}
                  clickable
                  color={teamFilter === 'away' ? 'primary' : 'default'}
                  onClick={() => setTeamFilter('away')}
                />
              </Box>
            </>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {eventList.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                No match events available.
              </Typography>
            )}
            {eventList.length > 0 && visibleEvents.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                No match events match the selected filters.
              </Typography>
            )}
            {visibleEvents.map((event) => (
              <MatchEventRow
                key={event.id}
                event={event}
                teamName={event.isHome ? game.homeTeam.name : game.awayTeam.name}
              />
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

function isSubstitutionEvent(type: string): boolean {
  return type.toLowerCase().includes('substitut');
}

function isScoreEvent(type: string): boolean {
  const normalized = type.toLowerCase();
  return (
    normalized.includes('try') ||
    normalized.includes('conversion') ||
    normalized.includes('goal')
  );
}

function parseSubstitution(comment: string): { on: string; off: string } | null {
  const match = comment.match(/off:\s*(.+?),\s*on:\s*(.+?)\s*$/i);
  if (!match) {
    return null;
  }
  return { off: match[1].trim(), on: match[2].trim() };
}

function MatchEventRow({
  event,
  teamName,
}: {
  event: MatchCommentary;
  teamName: string;
}) {
  const substitution = isSubstitutionEvent(event.type)
    ? parseSubstitution(event.comment)
    : null;

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        width: '100%',
        p: 1.5,
        borderLeft: 4,
        borderLeftColor: event.isHome ? 'primary.main' : 'grey.400',
      }}
    >
      <Typography
        variant="body2"
        sx={{ minWidth: 48, fontWeight: 'bold', textAlign: 'center' }}
      >
        {event.minute}&apos;
      </Typography>
      {substitution ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <Chip label="On" color="success" size="small" />
          <Typography
            variant="body2"
            sx={{ fontWeight: 'bold', color: 'success.dark', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {substitution.on}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            for
          </Typography>
          <Chip label="Off" variant="outlined" size="small" />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {substitution.off}
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" sx={{ flex: 1 }}>
          {event.comment}
        </Typography>
      )}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}
      >
        {teamName}
      </Typography>
    </Paper>
  );
}

function sortByShirtNumber(players: MatchPlayer[] | undefined): MatchPlayer[] {
  return [...(players || [])].sort(
    (a, b) => parseInt(a.shirtNumber || '0', 10) - parseInt(b.shirtNumber || '0', 10)
  );
}

interface TeamPanelProps {
  team: Team;
  isHome: boolean;
  lineup: MatchPlayer[];
  substitutes: MatchPlayer[];
  coaches: MatchPlayer[];
  substituteActiveNames?: Set<string>;
}

function TeamPanel({ team, isHome, lineup, substitutes, coaches, substituteActiveNames }: TeamPanelProps) {
  const teamSubstitutes = substitutes.filter((player) => player.isHome === isHome);
  const hasUnusedSubstitutes =
    substituteActiveNames !== undefined &&
    teamSubstitutes.some((player) => !nameInSet(player.name, substituteActiveNames));
  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
        {team.name}
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
        <SectionLabel label="Starters" />
        <RosterList
          players={lineup.filter((player) => player.isHome === isHome)}
        />
        <Divider sx={{ my: 2 }} />
        <SectionLabel label="Substitutes" />
        <RosterList players={teamSubstitutes} activeNames={substituteActiveNames} />
        {hasUnusedSubstitutes && (
          <Typography variant="caption" color="text.secondary">
            Dimmed players did not take the field.
          </Typography>
        )}
        <Divider sx={{ my: 2 }} />
        <SectionLabel label="Coaches" />
        {coaches
          .filter((coach) => coach.isHome === isHome)
          .map((coach, index) => (
            <Typography
              // biome-ignore lint/suspicious/noArrayIndexKey: roster players have no stable id exposed by the API
              key={index}
              variant="body2"
              sx={{ mb: 0.5 }}
            >
              {coach.name}
            </Typography>
          ))}
      </Paper>
    </>
  );
}

function nameInSet(name: string, set: Set<string>): boolean {
  const normalized = name.toLowerCase();
  if (set.has(normalized)) {
    return true;
  }
  const lastName = normalized.split(/\s+/).pop();
  if (!lastName) {
    return false;
  }
  for (const entry of set) {
    if (entry.split(/\s+/).pop() === lastName) {
      return true;
    }
  }
  return false;
}

function RosterList({ players, activeNames }: { players: MatchPlayer[]; activeNames?: Set<string> }) {
  return (
    <>
      {players.map((player, index) => {
        const dimmed = activeNames !== undefined && !nameInSet(player.name, activeNames);
        return (
          <Typography
            // biome-ignore lint/suspicious/noArrayIndexKey: roster players have no stable id exposed by the API
            key={index}
            variant="body2"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 0.5,
              color: dimmed ? 'text.disabled' : 'inherit',
            }}
          >
            <span>{player.name}</span>
            <Typography variant="caption" color="text.secondary">
              {player.position}
            </Typography>
          </Typography>
        );
      })}
    </>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
      {label}
    </Typography>
  );
}
