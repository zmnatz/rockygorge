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
  const file = crestFileName(remoteUrl);
  return file ? `/crests/${file}` : remoteUrl;
}
