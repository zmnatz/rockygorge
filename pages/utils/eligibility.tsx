import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Container,
  FormControl,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { ClubEligibilityReport, MatchParticipationReport } from '@zmnatz/usa-club-rugby-components';
import { clubKey, DEFAULT_RULES, listClubs, type PublishedClub, type ReportSource } from '@zmnatz/usa-club-rugby-data';
import { loadCurrentSeasonFixtures } from '@/api/capital';
import { clubPages } from '@/utils/clubPages';
import { eligibilityRoutes, loadParticipationSnapshot } from '@/utils/eligibility';
import { fixturesUrl, RUGBY_XPLORER_URL } from '@/utils/rugbyXplorer';

/** This site's own club, shown first. */
const DEFAULT_CLUB = 'Rocky Gorge';

export default function EligibilityPage() {
  const router = useRouter();
  const [source, setSource] = useState<ReportSource>('record');

  const queryClient = useQueryClient();
  const fixturesQuery = { queryKey: ['eligibility-fixtures'], queryFn: loadCurrentSeasonFixtures };
  const schedule = useQuery(fixturesQuery);
  // The CSV report asks for the fixtures when it is first run: the same query, so a list
  // already loaded for the match record isn't fetched again.
  const loadFixtures = () => queryClient.ensureQueryData(fixturesQuery);
  const fixtures = schedule.data;
  const saved = useQuery({
    queryKey: ['eligibility-record'],
    queryFn: loadParticipationSnapshot,
    retry: false,
  });

  const clubs: PublishedClub[] = useMemo(
    () => (fixtures ? listClubs(fixtures, DEFAULT_RULES).map((club) => ({ ...club, key: clubKey(club.name) })) : []),
    [fixtures],
  );
  const club =
    clubs.find((candidate) => candidate.key === router.query.club) ??
    clubs.find((candidate) => candidate.name === DEFAULT_CLUB) ??
    clubs[0] ??
    null;
  const clubSlug = (club && clubPages[club.name]?.slug) || null;
  const clubFixturesUrl = fixturesUrl(clubSlug);
  const isRecord = source === 'record';

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Eligibility Breakdown
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={source}
          onChange={(_, next) => {
            if (next) setSource(next as ReportSource);
          }}
          aria-label="Report source"
        >
          <ToggleButton value="record">Match record</ToggleButton>
          <ToggleButton value="csv">CSV report</ToggleButton>
        </ToggleButtonGroup>
        {isRecord && club && (
          <>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="eligibility-club-label">Club</InputLabel>
              <Select
                labelId="eligibility-club-label"
                label="Club"
                value={club.key}
                onChange={(event) => router.replace(eligibilityRoutes.club(event.target.value), undefined, { shallow: true })}
              >
                {clubs.map((candidate) => (
                  <MenuItem key={candidate.key} value={candidate.key}>
                    {candidate.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <MuiLink
              variant="body2"
              href={clubFixturesUrl ?? RUGBY_XPLORER_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {clubFixturesUrl ? `${club.name} fixtures on Rugby Xplorer` : 'Find this club on Rugby Xplorer'}
            </MuiLink>
          </>
        )}
      </Box>

      {isRecord && (schedule.isPending || saved.isPending) && (
        <Typography color="text.secondary">Loading the match record…</Typography>
      )}

      {isRecord && (schedule.isError || saved.isError || saved.data === null) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Could not load the match record. Try again, or use a CSV report.
        </Alert>
      )}

      {isRecord && schedule.isSuccess && clubs.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          The fixture list has no clubs yet. Use a CSV report instead.
        </Alert>
      )}

      {isRecord && club && fixtures && saved.data && (
        <ClubEligibilityReport
          key={club.key}
          club={club}
          saved={saved.data}
          fixtures={fixtures}
          playerHref={eligibilityRoutes.player}
        />
      )}

      {/* Stays mounted, so a pasted report survives switching to the match record and back. */}
      <div hidden={isRecord}>
        <MatchParticipationReport loadFixtures={loadFixtures} />
      </div>
    </Container>
  );
}
