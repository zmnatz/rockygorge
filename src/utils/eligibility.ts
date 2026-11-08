import type { EligibilityRoutes } from '@zmnatz/usa-club-rugby-components';
import type { ParticipationSnapshot } from '@zmnatz/usa-club-rugby-data';

// The eligibility rules and screens come from @zmnatz/usa-club-rugby-data and
// @zmnatz/usa-club-rugby-components. This holds only what is specific to this site.

export const PARTICIPATION_SNAPSHOT_FILE = 'participation.json';

/** Where this site serves the pages the eligibility components link to. */
export const eligibilityRoutes: EligibilityRoutes = {
  club: (clubKey) => `/utils/eligibility?club=${encodeURIComponent(clubKey)}`,
  player: (playerId) => `/player?id=${encodeURIComponent(playerId)}`,
  methodology: () => '/utils/eligibility-methodology',
};

/** Fetches the snapshot, or null when it isn't there. The host's catch-all
 *  rewrite answers a missing file with index.html and a 200, so a non-JSON
 *  response counts as missing. */
export async function loadParticipationSnapshot(): Promise<ParticipationSnapshot | null> {
  const res = await fetch(`/data/players/${PARTICIPATION_SNAPSHOT_FILE}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Match record request failed: ${res.status}`);
  if (!res.headers.get('content-type')?.includes('json')) return null;
  return (await res.json()) as ParticipationSnapshot;
}
