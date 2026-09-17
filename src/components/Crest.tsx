import { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box, { type BoxProps } from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import { crestSrc, isPlaceholderCrest, teamAbbreviation } from '@/utils/crest';

export type CrestSize = 'xs' | 'md' | 'lg' | 'xl';

const BASE_SX: SxProps<Theme> = { objectFit: 'contain', flexShrink: 0 };

// Standard crest sizes: xs (20px) is the default everywhere (ticker,
// event rows); larger presets serve the full score display.
const SIZE_PRESETS: Record<CrestSize, SxProps<Theme>> = {
  xs: { width: 20, height: 20 },
  md: { width: 24, height: 24 },
  lg: { width: { xs: 36, sm: 56 }, height: { xs: 36, sm: 56 } },
  xl: { width: { xs: 36, sm: 76 }, height: { xs: 36, sm: 76 } },
};

const AVATAR_FONT_SIZE: Record<CrestSize, string> = {
  xs: '0.65rem',
  md: '0.7rem',
  lg: '0.9rem',
  xl: '1.1rem',
};

interface CrestProps extends Omit<BoxProps<'img'>, 'src' | 'component' | 'size'> {
  src: string | undefined | null;
  alt: string;
  size?: CrestSize;
  /** Team name for the initials-avatar fallback when no image loads. */
  name?: string;
}

// Team crest with build-time local file and remote fallback: if the local
// snapshot is missing (e.g. a team added mid-season), swap to the CMS URL.
// Teams stuck on the CMS generic placeholder get an initials avatar instead
// of a wall of identical badges, as does any image that fails to load when
// the team name is provided — a logo never shows as a broken image.
export function Crest({ src, alt, size = 'xs', name, sx, ...rest }: CrestProps) {
  const [remoteFailed, setRemoteFailed] = useState(false);
  if (!src) {
    return null;
  }
  if (name && (isPlaceholderCrest(src) || remoteFailed)) {
    return (
      <Avatar
        sx={[
          BASE_SX,
          SIZE_PRESETS[size],
          { bgcolor: 'primary.main', fontSize: AVATAR_FONT_SIZE[size] },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        {teamAbbreviation(name)}
      </Avatar>
    );
  }
  const local = crestSrc(src);
  const remote = local === src ? undefined : src;
  return (
    <Box
      component="img"
      src={local}
      alt={alt}
      data-remote={remote}
      onError={(event) => {
        const img = event.currentTarget;
        if (remote && img.src !== remote) {
          img.src = remote;
        } else {
          setRemoteFailed(true);
        }
      }}
      sx={[BASE_SX, SIZE_PRESETS[size], ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...rest}
    />
  );
}
