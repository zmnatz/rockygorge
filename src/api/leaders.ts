import { useQuery } from '@tanstack/react-query';
import { type StandingsSnapshotIndex, seasonSnapshotFile } from '@/api/capital';
import type { LeadersSeason } from '@/utils/leaders';

// Written by the build (scripts/generate-leaders-index.ts): index.json lists
// the seasons and each season has its own file, so only one is downloaded.
const LEADERS_DIR = '/data/leaders';

async function fetchLeadersFile<T>(file: string): Promise<T | null> {
  try {
    const res = await fetch(`${LEADERS_DIR}/${file}`);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

// Leaders for one season. Nothing loads until `enabled` (the Leaders tab is
// open), and a null season means the snapshot has no such season.
export function useLeadersSeason(season: string, enabled: boolean) {
  const indexQuery = useQuery({
    queryKey: ['leaders-snapshot', 'index'],
    queryFn: () => fetchLeadersFile<StandingsSnapshotIndex>('index.json'),
    staleTime: Number.POSITIVE_INFINITY,
    enabled,
  });
  const available = !!season && !!indexQuery.data?.seasons.includes(season);
  const seasonQuery = useQuery({
    queryKey: ['leaders-snapshot', season],
    queryFn: () => fetchLeadersFile<LeadersSeason>(seasonSnapshotFile(season)),
    staleTime: Number.POSITIVE_INFINITY,
    enabled: enabled && available,
  });
  return {
    data: seasonQuery.data ?? null,
    isPending: enabled && (indexQuery.isPending || (available && seasonQuery.isPending)),
  };
}
