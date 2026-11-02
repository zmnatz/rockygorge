import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { Link as MuiLink } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useMatchWeather } from '@/api/weather';

// A rugby match runs about two hours; the weather window covers kickoff
// through full time when the calendar gives no explicit end.
const MATCH_WINDOW_MS = 2 * 60 * 60 * 1000;

const mapsEmbedUrl = (location: string) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;

const directionsUrl = (location: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`;

interface VenueDialogProps {
  location: string;
  start: string;
  open: boolean;
  onClose: () => void;
}

export function VenueDialog({ location, start, open, onClose }: VenueDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="venue-dialog-title"
    >
      <DialogTitle
        id="venue-dialog-title"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        {location}
        <IconButton aria-label="Close map" onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <VenueDetails location={location} start={start} />
      </DialogContent>
    </Dialog>
  );
}

// The dialog body, kept separate so it renders (and tests) without the
// client-only Modal shell.
export function VenueDetails({
  location,
  start,
}: {
  location: string;
  start: string;
}) {
  const kickoff = new Date(start).getTime();
  const end = Number.isNaN(kickoff)
    ? undefined
    : new Date(kickoff + MATCH_WINDOW_MS).toISOString();

  return (
    <>
      <Box
        component="iframe"
        title={`Map of ${location}`}
        src={mapsEmbedUrl(location)}
        sx={{ width: '100%', height: 350, border: 0, borderRadius: 1 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <VenueWeather location={location} start={start} end={end} />
      <Box sx={{ mt: 2 }}>
        <MuiLink
          href={directionsUrl(location)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Get Directions
        </MuiLink>
      </Box>
    </>
  );
}

function VenueWeather({
  location,
  start,
  end,
}: {
  location: string;
  start: string;
  end: string | undefined;
}) {
  const { data } = useMatchWeather(location, start, end);
  if (!data) {
    return null;
  }
  const temp =
    data.temperatureAtPractice === null
      ? ''
      : `${Math.round(data.temperatureAtPractice)}°F at kickoff · `;
  const type = data.weatherType ?? 'precipitation';
  const precip =
    data.atPracticeChance > 0
      ? `${data.atPracticeChance}% chance of ${type} during the match`
      : 'no precipitation expected during the match';
  return (
    <Typography variant="body2" sx={{ mt: 1.5 }}>
      {temp}
      {precip}
    </Typography>
  );
}
