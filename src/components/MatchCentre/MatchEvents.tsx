import { useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Crest } from '@/components/Crest';
import type { FixtureItem, MatchCommentary } from '@/types/match';
import {
  isScoreEvent,
  isSubstitutionEvent,
  parseScoringEvent,
  parseSubstitution,
} from './matchCentreUtils';

type EventFilter = 'all' | 'scores' | 'substitutions';
type TeamFilter = 'all' | 'home' | 'away';

interface MatchEventsProps {
  game: FixtureItem;
  events: MatchCommentary[];
}

export function MatchEvents({ game, events }: MatchEventsProps) {
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all');

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

  return (
    <>
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
        {visibleEvents.map((event) => {
          const crest = event.isHome ? game.homeTeam.crest : game.awayTeam.crest;
          const teamName = event.isHome ? game.homeTeam.name : game.awayTeam.name;
          return (
            <MatchEventRow
              key={event.id}
              event={event}
              crest={crest}
              teamName={teamName}
            />
          );
        })}
      </Box>
    </>
  );
}

function MatchEventRow({
  event,
  crest,
  teamName,
}: {
  event: MatchCommentary;
  crest: string;
  teamName: string;
}) {
  const substitution = isSubstitutionEvent(event.type)
    ? parseSubstitution(event.comment)
    : null;
  const scoring = !substitution && isScoreEvent(event.type)
    ? parseScoringEvent(event.comment)
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
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1,
            minWidth: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label="On" color="success" size="small" />
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
              {substitution.on}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label="Off" variant="outlined" size="small" />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: 'line-through' }}
            >
              {substitution.off}
            </Typography>
          </Box>
        </Box>
      ) : scoring ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 0.25, sm: 1 },
            minWidth: 0,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {scoring.eventType}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {scoring.player}
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" sx={{ flex: 1 }}>
          {event.comment}
        </Typography>
      )}
      {crest ? (
        <Crest src={crest} alt={teamName} />
      ) : (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}
        >
          {teamName}
        </Typography>
      )}
    </Paper>
  );
}
