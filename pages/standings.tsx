import type { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { ScoreCard } from '@/components/Scores/ScoreCard';
import type { Score } from '@/components/Scores/types';
import { LeadersTable, StandingsTable, TeamSummary } from '@/components/Scoreboard';
import { useLeadersSeason } from '@/api/leaders';
import { readPublishedJson } from '@/utils/publishedData';
import {
  ALL,
  compsOf,
  defaultSeason,
  filterFixtures,
  findTeamIdentity,
  groupFixturesByDate,
  isLeagueComp,
  isResult,
  ladderKeyFor,
  resultsOf,
  seasonsOf,
  teamIdentities,
  upcomingOf,
  useCapitalFixtures,
  snapshotLadder,
  useCompLadder,
  useStandingsSnapshot,
  type CapitalFixture,
  seasonSnapshotFile,
  type FixtureDateGroup,
  type InitialStandings,
  type LadderPool,
  type SeasonSnapshot,
  type StandingsSnapshotIndex,
} from '@/api/capital';
import type { LeadersDivision } from '@/utils/leaders';

type StandingsTab = 'standings' | 'scores' | 'fixtures' | 'leaders';

const STANDINGS_PATH = '/standings';
const TAB_VALUES: StandingsTab[] = ['standings', 'scores', 'fixtures', 'leaders'];

const TAB_LABELS: Record<StandingsTab, string> = {
  standings: 'Standings',
  scores: 'Scores',
  fixtures: 'Fixtures',
  leaders: 'Leaders',
};

// Scores keyed in before a game is played are dropped, matching isResult.
function toScore(fixture: CapitalFixture): Score {
  const played = isResult(fixture);
  return {
    id: fixture.id,
    dateTime: fixture.dateTime,
    compName: fixture.compName,
    homeTeam: {
      id: '',
      name: fixture.homeTeam.name,
      teamId: '',
      score: played ? fixture.homeTeam.score : '',
      crest: fixture.homeTeam.crest,
    },
    awayTeam: {
      id: '',
      name: fixture.awayTeam.name,
      teamId: '',
      score: played ? fixture.awayTeam.score : '',
      crest: fixture.awayTeam.crest,
    },
  };
}

function queryParam(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

// The index and the default season, from the nightly snapshot, so the first view needs no
// request. Missing files (e.g. local dev before first generate) leave the live fallback.
export const getStaticProps: GetStaticProps<StandingsPageProps> = async () => {
  const index = await readPublishedJson<StandingsSnapshotIndex>('standings/index.json');
  const season = index
    ? await readPublishedJson<SeasonSnapshot>(`standings/${seasonSnapshotFile(index.defaultSeason)}`)
    : null;
  return { props: { initial: index && season ? { index, season } : null } };
};

interface StandingsPageProps {
  initial: InitialStandings | null;
}

function tabParam(value: string | undefined): StandingsTab {
  // `results` was renamed Scores in the ESPN-style rework; old links still work.
  if (value === 'results') return 'scores';
  return value && (TAB_VALUES as string[]).includes(value) ? (value as StandingsTab) : 'standings';
}

export default function StandingsPage({ initial }: StandingsPageProps) {
  const router = useRouter();
  // The URL holds the tab, season, division and team (`?tab=scores&season=...`), so Back and
  // Forward step through them and a link shares them. A page with no parameter shows the
  // default (standings, the newest season, every division and team), which is what the
  // static HTML shows. An unknown value falls back to the default.
  const tab = tabParam(queryParam(router.query.tab));
  const urlSeason = queryParam(router.query.season);
  const urlComp = queryParam(router.query.comp) ?? ALL;
  const urlTeam = queryParam(router.query.team) ?? ALL;

  // The build snapshot is split by season and only the selected season is loaded (the
  // URL's, else the newest with results). The router's query is empty until it is ready,
  // so until then the default season's props are shown.
  const standingsSnapshot = useStandingsSnapshot(router.isReady || initial ? urlSeason : null, initial);
  // The CMS is only a fallback for when no snapshot was built: the nightly
  // build keeps the snapshot at most a day old.
  const liveEnabled = !standingsSnapshot.isPending && !standingsSnapshot.snapshot;
  const liveFixtures = useCapitalFixtures(liveEnabled);
  const fixtures = standingsSnapshot.snapshot?.fixtures ?? liveFixtures.data;
  const isPending =
    !fixtures && (standingsSnapshot.isPending || (liveEnabled && liveFixtures.isPending));
  const isError = !fixtures && liveFixtures.isError;
  const refetch = liveFixtures.refetch;

  // Sevens tournaments and one-off comps stay off the league board entirely.
  const leagueFixtures = useMemo(
    () => fixtures?.filter((fixture) => isLeagueComp(fixture.compName)) ?? [],
    [fixtures]
  );

  // Only one season is loaded from the snapshot, so the full list comes
  // from its index (or, on the live fallback, from the fixtures).
  const snapshotSeasons = standingsSnapshot.index?.seasons;
  const seasons = useMemo(
    () => snapshotSeasons ?? seasonsOf(leagueFixtures),
    [leagueFixtures, snapshotSeasons]
  );
  const season =
    urlSeason && seasons.includes(urlSeason)
      ? urlSeason
      : (standingsSnapshot.index?.defaultSeason ??
        (leagueFixtures.length > 0 ? defaultSeason(leagueFixtures) : ''));
  const comps = useMemo(
    () => (season ? compsOf(leagueFixtures, season) : []),
    [leagueFixtures, season]
  );
  const compId = urlComp !== ALL && comps.some((comp) => comp.compId === urlComp) ? urlComp : ALL;
  const teams = useMemo(
    () => (season ? teamIdentities(leagueFixtures, season, compId) : []),
    [leagueFixtures, season, compId]
  );
  // The selected team as a cross-season identity (one team id per season in
  // the CMS, e.g. "D3" became "MD3"), resolved from display or season name. A team picked
  // in one season stays selected in another as long as it plays there; until that season
  // has loaded there are no teams, so it shows as unselected, then comes back.
  const identity = useMemo(
    () => (urlTeam === ALL ? undefined : findTeamIdentity(teams, urlTeam)),
    [teams, urlTeam]
  );
  const team = identity ? urlTeam : ALL;
  const teamNames = useMemo(
    () => (identity ? identity.names : [ALL]),
    [identity]
  );
  const seasonLoaded = leagueFixtures.some((item) => item.season === season);

  // Changes the URL, keeping what isn't named. Defaults are left out of it.
  const navigate = (next: { tab?: StandingsTab; season?: string; comp?: string; team?: string }) => {
    const state = { tab, season, comp: compId, team, ...next };
    const query: Record<string, string> = {};
    if (state.tab !== 'standings') query.tab = state.tab;
    if (state.season) query.season = state.season;
    if (state.comp !== ALL) query.comp = state.comp;
    if (state.team !== ALL) query.team = state.team;
    router.push({ pathname: STANDINGS_PATH, query }, undefined, { shallow: true, scroll: false });
  };

  const filtered = useMemo(
    () => filterFixtures(leagueFixtures, { season: season || ALL, compId, team: teamNames }),
    [leagueFixtures, season, compId, teamNames]
  );
  const results = useMemo(() => resultsOf(filtered), [filtered]);
  const upcoming = useMemo(() => upcomingOf(filtered), [filtered]);
  const scoreGroups = useMemo(() => groupFixturesByDate(results), [results]);
  const fixtureGroups = useMemo(() => groupFixturesByDate(upcoming), [upcoming]);

  // Standings need a single division: default to the first tab so a table
  // loads immediately. With a team picked but no division, jump to the first
  // division that team plays in. An explicitly picked division always wins.
  const ladderCompId = useMemo(() => {
    if (compId !== ALL && comps.some((comp) => comp.compId === compId)) {
      return compId;
    }
    if (team !== ALL) {
      const names = identity ? identity.names : [team];
      const withTeam = comps.find((comp) =>
        leagueFixtures.some(
          (item) =>
            item.compId === comp.compId &&
            (season === '' || item.season === season) &&
            (names.includes(item.homeTeam?.name) || names.includes(item.awayTeam?.name))
        )
      );
      if (withTeam) {
        return withTeam.compId;
      }
    }
    return comps[0]?.compId ?? ALL;
  }, [compId, comps, leagueFixtures, season, team, identity]);

  const ladderSeason = season;

  const ladderKey = useMemo(
    () =>
      ladderCompId !== ALL && ladderSeason
        ? ladderKeyFor(leagueFixtures, ladderCompId, ladderSeason)
        : null,
    [leagueFixtures, ladderCompId, ladderSeason]
  );
  // Ladders come from the snapshot too; the CMS is asked only for a season
  // the snapshot doesn't have. A snapshot season without a ladder means the
  // division publishes no table.
  const ladderSeasonInIndex =
    !!ladderKey && !!standingsSnapshot.index?.seasons.includes(ladderKey.season);
  const liveLadder = !standingsSnapshot.isPending && !!ladderKey && !ladderSeasonInIndex;
  const ladderQuery = useCompLadder(ladderKey, liveLadder);
  const ladder = snapshotLadder(standingsSnapshot.snapshot, ladderKey) ?? ladderQuery.data;
  const ladderPending =
    !ladder &&
    (liveLadder ? ladderQuery.isPending : standingsSnapshot.isPending || !seasonLoaded);

  // Division-wide results feed the streak column; the team filter only
  // highlights rows, it never narrows the table.
  const compResults = useMemo(
    () =>
      resultsOf(
        filterFixtures(leagueFixtures, {
          season: ladderSeason || ALL,
          compId: ladderCompId,
          team: ALL,
        })
      ),
    [leagueFixtures, ladderSeason, ladderCompId]
  );
  // Leaders load only while their tab is open, one season's file at a time.
  const leaders = useLeadersSeason(season, tab === 'leaders');
  const leadersDivision = leaders.data?.divisions.find(
    (division) => division.compId === ladderCompId
  );

  const visiblePools = useMemo(() => {
    const pools = ladder?.ladderPools ?? [];
    if (team === ALL) {
      return pools;
    }
    return pools.filter((pool) =>
      pool.teams.some((row) => teamNames.includes(row.name))
    );
  }, [ladder, team, teamNames]);

  // Division ids are minted per season, so a season switch always resets the
  // division; the team stays if it plays in the new season (see above).
  const handleSeasonChange = (value: string) => navigate({ season: value, comp: ALL });

  // A team link in the Leaders table: show that team's standings in the
  // division it was listed under.
  const handleSelectTeamFromLeaders = (name: string) => {
    const found = findTeamIdentity(teamIdentities(leagueFixtures, season, ladderCompId), name);
    navigate({ tab: 'standings', comp: ladderCompId, team: found?.display ?? name });
  };

  const handleCompChange = (value: string) =>
    navigate({
      comp: value,
      team:
        team !== ALL && !findTeamIdentity(teamIdentities(leagueFixtures, season, value), team)
          ? ALL
          : team,
    });

  return (
    <Box sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Head>
        <title>Capital Rugby Standings & Scoreboard | Rocky Gorge Rugby</title>
        <meta
          name="description"
          content="Capital Rugby Union league tables, scoreboards, fixtures and season stats by division and season, with Rocky Gorge game details and player histories."
        />
      </Head>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Capital Rugby
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        League tables, scoreboards and season stats for every Capital Rugby Union
        division — filter by season, division and team.
      </Typography>

      {isPending && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 8 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading league fixtures…
          </Typography>
        </Box>
      )}

      {!isPending && (isError || !fixtures) && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 8 }}>
          <Typography variant="body2" color="text.secondary">
            Failed to load league fixtures.
          </Typography>
          <Button variant="outlined" onClick={() => refetch()}>
            Retry
          </Button>
        </Box>
      )}

      {!isPending && !isError && fixtures && (
        <>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              mb: 2,
            }}
          >
            <FormControl sx={{ minWidth: 160 }} size="small">
              <InputLabel id="standings-season-label">Season</InputLabel>
              <Select
                labelId="standings-season-label"
                value={season}
                label="Season"
                onChange={(event) => handleSeasonChange(event.target.value)}
              >
                {seasons.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 220 }} size="small">
              <InputLabel id="standings-comp-label">Division</InputLabel>
              <Select
                labelId="standings-comp-label"
                value={compId}
                label="Division"
                onChange={(event) => handleCompChange(event.target.value)}
              >
                <MenuItem value={ALL}>
                  <em>All divisions</em>
                </MenuItem>
                {comps.map((comp) => (
                  <MenuItem key={comp.compId} value={comp.compId}>
                    {comp.compName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 220 }} size="small">
              <InputLabel id="standings-team-label">Team</InputLabel>
              <Select
                labelId="standings-team-label"
                value={team}
                label="Team"
                onChange={(event) => navigate({ team: event.target.value })}
              >
                <MenuItem value={ALL}>
                  <em>All teams</em>
                </MenuItem>
                {teams.map((identity) => (
                  <MenuItem key={identity.key} value={identity.display}>
                    {identity.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {team !== ALL && (
            <TeamSummary
              team={team}
              results={results}
              upcoming={upcoming}
              fixtures={leagueFixtures}
            />
          )}

          <Tabs
            value={tab}
            onChange={(_event, value: StandingsTab) => navigate({ tab: value })}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Capital rugby views"
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={TAB_LABELS.standings} value="standings" />
            <Tab label={TAB_LABELS.scores} value="scores" />
            <Tab label={TAB_LABELS.fixtures} value="fixtures" />
            <Tab label={TAB_LABELS.leaders} value="leaders" />
          </Tabs>

          {tab === 'standings' && (
            <StandingsTabPanel
              activeCompId={ladderCompId}
              team={team}
              teamNames={teamNames}
              comps={comps}
              pools={visiblePools}
              showPoolNames={(ladder?.ladderPools.length ?? 0) > 1}
              compResults={compResults}
              isPending={ladderPending}
              isError={!ladder && liveLadder && ladderQuery.isError}
              isEmpty={!ladder}
              onSelectComp={handleCompChange}
            />
          )}

          {tab === 'leaders' && (
            <LeadersTabPanel
              activeCompId={ladderCompId}
              comps={comps}
              teamNames={teamNames}
              season={season}
              fixtures={compResults}
              onSelectTeam={handleSelectTeamFromLeaders}
              division={leadersDivision}
              isPending={leaders.isPending}
              onSelectComp={handleCompChange}
            />
          )}

          {(tab === 'scores' || tab === 'fixtures') && (
            <>
              <Box sx={{ mb: 2 }}>
                <DateChips groups={tab === 'scores' ? scoreGroups : fixtureGroups} />
              </Box>
              <FixtureList
                groups={tab === 'scores' ? scoreGroups : fixtureGroups}
                showTime={tab === 'fixtures'}
                emptyMessage={
                  tab === 'scores'
                    ? 'No results match the selected filters.'
                    : 'No upcoming fixtures match the selected filters.'
                }
              />
            </>
          )}
        </>
      )}
    </Box>
  );
}

function StandingsTabPanel({
  activeCompId,
  team,
  teamNames,
  comps,
  pools,
  showPoolNames,
  compResults,
  isPending,
  isError,
  isEmpty,
  onSelectComp,
}: {
  activeCompId: string;
  team: string;
  teamNames: string[];
  comps: { compId: string; compName: string }[];
  pools: LadderPool[];
  showPoolNames: boolean;
  compResults: CapitalFixture[];
  isPending: boolean;
  isError: boolean;
  isEmpty: boolean;
  onSelectComp: (compId: string) => void;
}) {
  if (comps.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        No divisions found for this season.
      </Typography>
    );
  }

  return (
    <Box>
      {comps.length > 1 && (
        <Tabs
          value={activeCompId}
          onChange={(_event, value: string) => onSelectComp(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Divisions"
          sx={{ mb: 3 }}
        >
          {comps.map((comp) => (
            <Tab key={comp.compId} label={comp.compName} value={comp.compId} />
          ))}
        </Tabs>
      )}
      {isPending && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}
      {!isPending && (isError || isEmpty) && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No official table is published for this division. Try the Scores tab
          to see its games.
        </Typography>
      )}
      {!isPending && !isError && !isEmpty && pools.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {team === ALL
            ? 'This division has no pools yet.'
            : `No pool in this division includes ${team}.`}
        </Typography>
      )}
      {!isPending && !isError && !isEmpty && pools.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {pools.map((pool) => (
            <StandingsTable
              key={pool.id}
              pool={pool}
              selectedTeamNames={teamNames}
              fixtures={compResults}
              showPoolName={showPoolNames}
            />
          ))}
          <Typography variant="caption" color="text.secondary">
            Official Rugby Xplorer table. W/L/D = won/lost/drawn, PCT = win
            percentage (draws count half), PF/PA = points for/against, BP =
            bonus points, PTS = competition points, STRK = current streak.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function LeadersTabPanel({
  activeCompId,
  comps,
  season,
  fixtures,
  onSelectTeam,
  teamNames,
  division,
  isPending,
  onSelectComp,
}: {
  fixtures: CapitalFixture[];
  onSelectTeam: (team: string) => void;
  activeCompId: string;
  comps: { compId: string; compName: string }[];
  season: string;
  teamNames: string[];
  division: LeadersDivision | undefined;
  isPending: boolean;
  onSelectComp: (compId: string) => void;
}) {
  if (comps.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        No divisions found for this season.
      </Typography>
    );
  }
  return (
    <Box>
      {comps.length > 1 && (
        <Tabs
          value={activeCompId}
          onChange={(_event, value: string) => onSelectComp(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Divisions"
          sx={{ mb: 3 }}
        >
          {comps.map((comp) => (
            <Tab key={comp.compId} label={comp.compName} value={comp.compId} />
          ))}
        </Tabs>
      )}
      {isPending && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}
      {!isPending && (!division || division.players.length === 0) && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No scoring leaders are available for this division.
        </Typography>
      )}
      {!isPending && division && division.players.length > 0 && (
        <LeadersTable
          division={division}
          season={season}
          selectedTeamNames={teamNames}
          fixtures={fixtures}
          onSelectTeam={onSelectTeam}
        />
      )}
    </Box>
  );
}

// Date jump-links, ESPN scoreboard style, for long game-day lists.
function DateChips({ groups }: { groups: FixtureDateGroup[] }) {
  if (groups.length < 2) {
    return <Box />;
  }
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {groups.map((group) => (
        <Chip
          key={group.dateKey}
          label={new Date(group.divisions[0].fixtures[0].dateTime).toLocaleDateString(
            undefined,
            { weekday: 'short', month: 'numeric', day: 'numeric' }
          )}
          component="a"
          href={`#date-${group.dateKey}`}
          clickable
          size="small"
          variant="outlined"
        />
      ))}
    </Box>
  );
}

function FixtureList({
  groups,
  showTime,
  emptyMessage,
}: {
  groups: FixtureDateGroup[];
  showTime: boolean;
  emptyMessage: string;
}) {
  const gameCount = groups.reduce(
    (total, group) =>
      total +
      group.divisions.reduce((day, division) => day + division.fixtures.length, 0),
    0
  );
  if (gameCount === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        {emptyMessage}
      </Typography>
    );
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {groups.map((group) => {
        const dayCount = group.divisions.reduce(
          (total, division) => total + division.fixtures.length,
          0
        );
        return (
          <Box
            key={group.dateKey}
            id={`date-${group.dateKey}`}
            component="section"
            aria-label={group.label}
            sx={{ scrollMarginTop: 80 }}
          >
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
              {group.label}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {dayCount} {dayCount === 1 ? 'game' : 'games'}
            </Typography>
            {group.divisions.map((division) => {
              const rounds = [
                ...new Set(division.fixtures.map((item) => item.round)),
              ].filter(Boolean);
              return (
                <Box key={division.compName} sx={{ mt: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="primary"
                    sx={{ fontWeight: 'bold', mb: 1 }}
                  >
                    {division.compName}
                    {rounds.length > 0 ? ` • ${rounds.join(' / ')}` : ''}
                  </Typography>
                  <Grid container spacing={2} columns={{ xs: 1, sm: 2, lg: 3 }}>
                    {division.fixtures.map((item) => (
                      <Grid key={item.id} size={{ xs: 1, sm: 1, lg: 1 }}>
                        <Link
                          href={`/game?id=${item.id}`}
                          style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                        >
                          <ScoreCard score={toScore(item)} hideFooter />
                        </Link>
                        {showTime && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}
                          >
                            {new Date(item.dateTime).toLocaleTimeString(undefined, {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </Typography>
                        )}
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}

