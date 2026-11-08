import { parseTeamSide } from '@zmnatz/usa-club-rugby-data';

// Local crest files baked at build time (scripts/generate-crests.ts).
// Remote CMS URLs like `.../ru/team/91273.png?v=...` map deterministically
// to `/crests/91273.webp`. Unknown patterns (or a missing local file, e.g.
// a mid-season new team) fall back to the remote URL at render time.

const TEAM_CREST_PATTERN = /\/team\/(\d+)\.(png|jpg|jpeg|webp)/i;

export function crestFileName(remoteUrl: string): string | null {
  const match = remoteUrl.match(TEAM_CREST_PATTERN);
  return match ? `${match[1]}.webp` : null;
}

export function crestSrc(remoteUrl: string | undefined | null): string {
  if (!remoteUrl) {
    return '';
  }
  // Snapshots only exist after a build's generate step, so in dev always use
  // the remote URL — otherwise every team without a local snapshot 404s
  // before falling back.
  if (process.env.NODE_ENV === 'development') {
    return remoteUrl;
  }
  const file = crestFileName(remoteUrl);
  return file ? `/crests/${file}` : remoteUrl;
}

// Most CMS teams share a single generic placeholder image instead of a real
// logo. Detect it so the UI can render initials avatars instead of hundreds
// of identical badges.
export function isPlaceholderCrest(remoteUrl: string | undefined | null): boolean {
  return !!remoteUrl && remoteUrl.includes('/NonVideo/');
}

// A fixture often carries the placeholder when the side's club has a real crest
// in the CMS (scripts/generate-club-pages.ts), so the club's crest is used then.
export function resolveTeamCrest(
  fixtureCrest: string | undefined | null,
  teamName: string | undefined,
  clubs: Record<string, { crest: string | null } | undefined>
): string | undefined | null {
  if (fixtureCrest && !isPlaceholderCrest(fixtureCrest)) {
    return fixtureCrest;
  }
  const side = teamName ? parseTeamSide(teamName) : null;
  return (side && clubs[side.clubName]?.crest) || fixtureCrest;
}

// Short code for avatar fallbacks, e.g. "Rocky Gorge MD3" -> "RGM".
export function teamAbbreviation(teamName: string): string {
  const letters = teamName
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z]/g, '').charAt(0))
    .join('')
    .toUpperCase();
  return (letters.slice(0, 3) || '?').padEnd(2, '•');
}
