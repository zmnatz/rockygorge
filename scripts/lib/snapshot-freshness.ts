import fs from 'node:fs';
import path from 'node:path';

// Build-time snapshots (public/data/**, public/crests, .cache/leaders) are committed to the
// repo and refreshed nightly by .github/workflows/update-snapshots.yml. Each
// generate script records when it last succeeded in this manifest and skips
// its CMS pulls while that is under MAX_AGE_MS old, unless forced.
export const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type SnapshotName = 'scores' | 'standings' | 'leaders' | 'players' | 'crests';

export type SnapshotManifest = Partial<Record<SnapshotName, string>>;

export function manifestPath(root = process.cwd()): string {
  return path.join(root, 'public', 'data', 'manifest.json');
}

export function readManifest(root = process.cwd()): SnapshotManifest {
  try {
    return JSON.parse(fs.readFileSync(manifestPath(root), 'utf-8'));
  } catch {
    return {};
  }
}

// `--force` on the command line or FORCE_SNAPSHOTS=1 in the environment
// (the latter is what lets `bun run build` be forced).
export function isForced(
  argv: string[] = process.argv,
  env: Record<string, string | undefined> = process.env
): boolean {
  const flag = env.FORCE_SNAPSHOTS;
  return argv.includes('--force') || (!!flag && flag !== '0' && flag !== 'false');
}

export function isFresh(
  name: SnapshotName,
  options: { now?: number; manifest?: SnapshotManifest; forced?: boolean } = {}
): boolean {
  if (options.forced ?? isForced()) {
    return false;
  }
  const stamp = (options.manifest ?? readManifest())[name];
  const updated = stamp ? Date.parse(stamp) : Number.NaN;
  if (Number.isNaN(updated)) {
    return false;
  }
  const age = (options.now ?? Date.now()) - updated;
  // A timestamp from the future (clock skew) is not trusted.
  return age >= 0 && age < MAX_AGE_MS;
}

// Returns true (and logs) when the caller should skip its update.
export function skipIfFresh(name: SnapshotName, requiredPath: string): boolean {
  if (!fs.existsSync(requiredPath) || !isFresh(name)) {
    return false;
  }
  const stamp = readManifest()[name];
  console.log(
    `Skipping ${name} snapshot: updated ${stamp}, under a day old (use --force or FORCE_SNAPSHOTS=1 to refresh).`
  );
  return true;
}

export function markUpdated(name: SnapshotName, now = new Date(), root = process.cwd()): void {
  const manifest = readManifest(root);
  manifest[name] = now.toISOString();
  fs.mkdirSync(path.dirname(manifestPath(root)), { recursive: true });
  fs.writeFileSync(manifestPath(root), `${JSON.stringify(manifest, null, 2)}\n`);
}
