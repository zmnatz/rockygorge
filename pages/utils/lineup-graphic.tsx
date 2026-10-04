import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import Head from 'next/head';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  LINEUP_H,
  LINEUP_W,
  SPONSOR_MAX,
  drawLineup,
  type SponsorLogo,
} from '@/components/LineupGraphic/drawLineup';
import { parseRosterText, SAMPLE_ROSTER_TEXT } from '@/utils/lineup';

interface SponsorItem extends SponsorLogo {
  id: string;
  name: string;
  url: string;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image file.'));
    img.src = url;
  });
}

export default function LineupGraphicPage() {
  const [division, setDivision] = useState('D1');
  const [homeTeam, setHomeTeam] = useState('ROCKY GORGE');
  const [awayTeam, setAwayTeam] = useState('WASHINGTON IRISH');
  const [subtitle, setSubtitle] = useState('Sat Oct 3, 1ko | Anacostia Park, Washington DC');
  const [rosterText, setRosterText] = useState(SAMPLE_ROSTER_TEXT);
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [sponsorError, setSponsorError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const parsed = useMemo(() => parseRosterText(rosterText), [rosterText]);

  const lineupData = useMemo(
    () => ({
      division: division.trim() || 'D1',
      homeTeam: homeTeam.trim() || 'ROCKY GORGE',
      awayTeam: awayTeam.trim() || 'WASHINGTON IRISH',
      subtitle: subtitle.trim(),
      players: parsed.players,
    }),
    [division, homeTeam, awayTeam, subtitle, parsed.players]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawLineup(ctx, lineupData, sponsors);
    // Redraw once the condensed athletic fonts arrive (canvas uses them directly).
    let cancelled = false;
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        if (cancelled) return;
        const live = canvasRef.current?.getContext('2d');
        if (live) drawLineup(live, lineupData, sponsors);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [lineupData, sponsors]);

  const handleSponsorFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    if (files.length === 0) return;
    setSponsorError(null);
    const room = SPONSOR_MAX - sponsors.length;
    if (room <= 0) {
      setSponsorError(`Up to ${SPONSOR_MAX} sponsor logos. Remove one to add another.`);
      return;
    }
    for (const file of files.slice(0, room)) {
      if (!file.type.startsWith('image/')) {
        setSponsorError(`"${file.name}" is not an image — skipped.`);
        continue;
      }
      const url = URL.createObjectURL(file);
      try {
        const element = await loadImage(url);
        setSponsors((current) =>
          current.length >= SPONSOR_MAX
            ? current
            : [...current, { id: `${Date.now()}-${file.name}`, name: file.name, url, element }]
        );
      } catch {
        URL.revokeObjectURL(url);
        setSponsorError(`Could not read "${file.name}" — try a PNG or JPG.`);
      }
    }
  };

  const handleRemoveSponsor = (id: string) => {
    setSponsors((current) => {
      const leaving = current.find((s) => s.id === id);
      if (leaving) URL.revokeObjectURL(leaving.url);
      return current.filter((s) => s.id !== id);
    });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const slug = `${lineupData.division}-${lineupData.awayTeam}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.href = url;
    link.download = `lineup-${slug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('empty');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopyState('ok');
    } catch {
      setCopyState('fail');
    }
    window.setTimeout(() => setCopyState('idle'), 2500);
  };

  return (
    <>
      <Head>
        <title>Lineup Graphic Generator | Rocky Gorge Rugby</title>
        <meta
          name="description"
          content="Paste a 23-player roster and generate a shareable gameday lineup graphic."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Teko:wght@500;600;700&family=Barlow+Condensed:ital,wght@0,500;0,600;0,700;0,800;1,500;1,600;1,700;1,800&family=Oswald:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Lineup Graphic Generator
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 820 }}>
          Enter the matchup, paste the roster (one per line as{' '}
          <Box component="code" sx={{ fontFamily: 'monospace' }}>1 First Last</Box> or{' '}
          <Box component="code" sx={{ fontFamily: 'monospace' }}>First Last 1</Box>, mark the
          captain with <Box component="code" sx={{ fontFamily: 'monospace' }}>(C)</Box>, put
          finishers on shared lines with dashes). The canvas redraws live — then download or
          copy the PNG.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: '420px 1fr' },
            alignItems: 'start',
          }}
        >
          <Paper sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 2 }}>
              <TextField
                label="Side"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                placeholder="D1"
              />
              <TextField
                label="Subtitle (date, KO | venue)"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Sat Oct 3, 1ko | Anacostia Park, Washington DC"
              />
            </Box>
            <TextField
              label="Home team"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
            />
            <TextField
              label="Away team"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
            />
            <TextField
              label="Roster — paste 23 lines"
              multiline
              minRows={14}
              maxRows={22}
              fullWidth
              value={rosterText}
              onChange={(e) => setRosterText(e.target.value)}
              placeholder={SAMPLE_ROSTER_TEXT}
              sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13 } }}
            />
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip
                size="small"
                color={parsed.players.length === 23 ? 'success' : 'warning'}
                label={`${parsed.players.length}/23 parsed`}
              />
              <Chip size="small" label={`${parsed.players.filter((p) => p.number <= 15).length} starters`} />
              <Chip size="small" label={`${parsed.players.filter((p) => p.number >= 16).length} finishers`} />
            </Stack>
            {parsed.errors.length > 0 && (
              <Alert severity={parsed.players.length === 0 ? 'error' : 'warning'}>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {parsed.errors.slice(0, 6).map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                  {parsed.errors.length > 6 && <li>…and {parsed.errors.length - 6} more</li>}
                </Box>
              </Alert>
            )}
            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                  Sponsor logos ({sponsors.length}/{SPONSOR_MAX})
                </Typography>
                <Button variant="outlined" size="small" component="label" startIcon={<UploadIcon />}>
                  Upload
                  <input type="file" accept="image/*" multiple hidden onChange={handleSponsorFiles} />
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Placed in uniform white pills across the footer — mixed sizes are
                contain-fit to the same box.
              </Typography>
              {sponsorError && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  {sponsorError}
                </Alert>
              )}
              {sponsors.length > 0 ? (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  {sponsors.map((s) => (
                    <Box
                      key={s.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        pl: 1,
                        pr: 0.5,
                        py: 0.5,
                      }}
                    >
                      <Box
                        component="img"
                        src={s.url}
                        alt={s.name}
                        sx={{ height: 36, maxWidth: 90, objectFit: 'contain', backgroundColor: '#fff', borderRadius: 1 }}
                      />
                      <IconButton
                        aria-label={`Remove ${s.name}`}
                        size="small"
                        onClick={() => handleRemoveSponsor(s.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  No logos yet — footer stays clean until you add some.
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Button
                variant="text"
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={() => {
                  setDivision('D1');
                  setHomeTeam('ROCKY GORGE');
                  setAwayTeam('WASHINGTON IRISH');
                  setSubtitle('Sat Oct 3, 1ko | Anacostia Park, Washington DC');
                  setRosterText(SAMPLE_ROSTER_TEXT);
                }}
              >
                Load sample
              </Button>
              <Button variant="text" size="small" onClick={() => setRosterText('')}>
                Clear
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload}>
                Download PNG
              </Button>
              <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleCopy}>
                Copy image
              </Button>
              {copyState === 'ok' && <Chip size="small" color="success" label="Copied — paste into social" />}
              {copyState === 'fail' && (
                <Chip size="small" color="error" label="Copy blocked — use Download" />
              )}
            </Stack>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                backgroundColor: '#0a0a0a',
                borderRadius: 2,
                p: 2,
              }}
            >
              <canvas
                ref={canvasRef}
                width={LINEUP_W}
                height={LINEUP_H}
                style={{ width: '100%', maxWidth: 520, height: 'auto', borderRadius: 8 }}
                aria-label={`Lineup graphic: ${lineupData.homeTeam} versus ${lineupData.awayTeam}`}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
              {LINEUP_W}×{LINEUP_H} PNG (4:5 portrait). Background swirls are procedurally drawn —
              no image asset needed.
            </Typography>
          </Paper>
        </Box>
      </Container>
    </>
  );
}
