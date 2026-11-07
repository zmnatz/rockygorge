import NextLink from 'next/link';
import type { ComponentProps } from 'react';
import { Link as MuiLink } from '@mui/material';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import features from '@config/features.yml';
import { isNameWithheld, playerKey } from '@/utils/playerHistory';
import type { MatchPlayer, Team } from '@/types/match';
import { nameInSet } from './matchCentreUtils';

interface TeamPanelProps {
  team: Team;
  isHome: boolean;
  lineup: MatchPlayer[];
  substitutes: MatchPlayer[];
  coaches: MatchPlayer[];
  substituteActiveNames?: Set<string>;
}

export function TeamPanel({ team, isHome, lineup, substitutes, coaches, substituteActiveNames }: TeamPanelProps) {
  const teamSubstitutes = substitutes.filter((player) => player.isHome === isHome);
  const hasUnusedSubstitutes =
    substituteActiveNames !== undefined &&
    teamSubstitutes.some((player) => !nameInSet(player.name, substituteActiveNames));
  const hasWithheldName = [...lineup, ...substitutes].some(
    (player) => player.isHome === isHome && isNameWithheld(player.name)
  );
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
        {hasWithheldName && (
          <Typography variant="caption" color="error" component="p">
            Names in red are not public in Rugby Xplorer.
          </Typography>
        )}
        <Divider sx={{ my: 2 }} />
        <SectionLabel label="Coaches" />
        {coaches
          .filter((coach) => coach.isHome === isHome)
          .map((coach, index) => (
            <PlayerName
              // biome-ignore lint/suspicious/noArrayIndexKey: roster players have no stable id exposed by the API
              key={index}
              player={coach}
              variant="body2"
              sx={{ display: 'block', mb: 0.5 }}
            />
          ))}
      </Paper>
    </>
  );
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
            <PlayerName player={player} color="inherit" />
            <Typography variant="caption" color="text.secondary">
              {player.position}
            </Typography>
          </Typography>
        );
      })}
    </>
  );
}

// Links to the player's page unless the playerLinks feature is switched off.
function PlayerName({
  player,
  ...linkProps
}: { player: MatchPlayer } & Omit<ComponentProps<typeof MuiLink>, 'href' | 'component'>) {
  if (isNameWithheld(player.name)) {
    return (
      <Typography component="span" variant="inherit" color="error">
        {player.name}
      </Typography>
    );
  }
  if (!features.playerLinks) {
    return <>{player.name}</>;
  }
  return (
    <MuiLink
      component={NextLink}
      href={`/player?id=${playerKey(player.id)}`}
      underline="hover"
      {...linkProps}
    >
      {player.name}
    </MuiLink>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
      {label}
    </Typography>
  );
}
