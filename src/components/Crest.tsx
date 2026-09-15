import Box, { type BoxProps } from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import { crestSrc } from '@/utils/crest';

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

interface CrestProps extends Omit<BoxProps<'img'>, 'src' | 'component' | 'size'> {
  src: string | undefined | null;
  alt: string;
  size?: CrestSize;
}

// Team crest with build-time local file and remote fallback: if the local
// snapshot is missing (e.g. a team added mid-season), swap to the CMS URL.
export function Crest({ src, alt, size = 'xs', sx, ...rest }: CrestProps) {
  if (!src) {
    return null;
  }
  const local = crestSrc(src);
  return (
    <Box
      component="img"
      src={local}
      alt={alt}
      data-remote={local === src ? undefined : src}
      onError={(event) => {
        const img = event.currentTarget;
        const remote = img.dataset.remote;
        if (remote && img.src !== remote) {
          img.src = remote;
        }
      }}
      sx={[BASE_SX, SIZE_PRESETS[size], ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...rest}
    />
  );
}
