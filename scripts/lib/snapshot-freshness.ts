import fs from 'node:fs';
import path from 'node:path';

// Snapshots (public/data/**, public/crests, .cache/matches) are committed to the
// repo and refreshed nightly by .github/workflows/update-snapshots.yml, which
// always forces a refresh. Builds never generate them. Two small files track
// them; the second is local and not committed:
//
// - public/data/manifest.json: when each snapshot's content last CHANGED, and
//   the FORMAT version it was generated with.
// - .cache/snapshots-checked.json: when each snapshot was last CHECKED
//   against the CMS (changed or not). Freshness is judged from this one.
//
// A run that finds nothing new rewrites only the checked file, so data files
// (and git history) don't churn. Run unforced, a generate script skips a
// snapshot whose format is current: locally always, and in CI while the checked
// time is under MAX_AGE_MS old. Nothing runs unforced in CI today; the nightly
// workflow forces every run.
export const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type SnapshotName = 'scores' | 'standings' | 'leaders' | 'players' | 'crests' | 'clubPages' | 'matches';

// Bump a snapshot's number whenever the shape of its output (or the
// generator's logic) changes. A committed snapshot with a different format is
// stale everywhere, local builds included, so the PR must regenerate and
// commit it (`bun run generate:force`); src/__tests__/snapshot-freshness.test.ts
// fails until it does.
export const SNAPSHOT_FORMATS: Record<SnapshotName, number> = {
  scores: 3,
  standings: 2,
  leaders: 1,
  players: 8,
  crests: 1,
  clubPages: 3,
  // The match archive: bump only when the fields requested from the CMS change,
  // as it downloads every season again. Other snapshots rebuild from it.
  matches: 1,
};

export type SnapshotStamps = Partial<Record<SnapshotName, string>>;
export type SnapshotManifest = Partial<
  Record<SnapshotName, { updatedAt: string; format: number }>
>;

export function manifestPath(root = process.cwd()): string {
  return path.join(root, 'public', 'data', 'manifest.json');
}

export function checkedPath(root = process.cwd()): string {
  return path.join(root, '.cache', 'snapshots-checked.json');
}

function readJson<T>(file: string): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return {} as T;
  }
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function readManifest(root = process.cwd()): SnapshotManifest {
  return readJson(manifestPath(root));
}

export function readChecked(root = process.cwd()): SnapshotStamps {
  return readJson(checkedPath(root));
}

// Netlify and GitHub Actions both set CI; their checkouts are throwaway.
export function isLocal(env: Record<string, string | undefined> = process.env): boolean {
  return !env.CI && !env.NETLIFY;
}

// `--force` on the command line or FORCE_SNAPSHOTS=1 in the environment
// (the latter is what the :force scripts set).
export function isForced(
  argv: string[] = process.argv,
  env: Record<string, string | undefined> = process.env
): boolean {
  const flag = env.FORCE_SNAPSHOTS;
  return argv.includes('--force') || (!!flag && flag !== '0' && flag !== 'false');
}

export function isFresh(
  name: SnapshotName,
  options: {
    now?: number;
    checked?: SnapshotStamps;
    manifest?: SnapshotManifest;
    forced?: boolean;
    local?: boolean;
  } = {}
): boolean {
  if (options.forced ?? isForced()) {
    return false;
  }
  if ((options.manifest ?? readManifest())[name]?.format !== SNAPSHOT_FORMATS[name]) {
    return false;
  }
  if (options.local ?? isLocal()) {
    return true;
  }
  const stamp = (options.checked ?? readChecked())[name];
  const checked = stamp ? Date.parse(stamp) : Number.NaN;
  if (Number.isNaN(checked)) {
    return false;
  }
  const age = (options.now ?? Date.now()) - checked;
  // A timestamp from the future (clock skew) is not trusted.
  return age >= 0 && age < MAX_AGE_MS;
}

// Returns true (and logs) when the caller should skip its update.
export function skipIfFresh(name: SnapshotName, requiredPath: string): boolean {
  if (!fs.existsSync(requiredPath) || !isFresh(name)) {
    return false;
  }
  console.log(
    `Skipping ${name} snapshot: using committed copy (checked ${readChecked()[name]}). Use --force or FORCE_SNAPSHOTS=1 to refresh.`
  );
  return true;
}

export function markChecked(name: SnapshotName, now = new Date(), root = process.cwd()): void {
  writeJson(checkedPath(root), { ...readChecked(root), [name]: now.toISOString() });
}

export function markUpdated(name: SnapshotName, now = new Date(), root = process.cwd()): void {
  writeJson(manifestPath(root), {
    ...readManifest(root),
    [name]: { updatedAt: now.toISOString(), format: SNAPSHOT_FORMATS[name] },
  });
}

// Call after a successful pull: always records the check, and records an
// update only when the content actually changed.
export function recordRun(name: SnapshotName, changed: boolean, now = new Date()): void {
  markChecked(name, now);
  // A format bump is recorded even if the regenerated content is identical.
  if (changed || readManifest()[name]?.format !== SNAPSHOT_FORMATS[name]) {
    markUpdated(name, now);
  }
}

// `generatedAt` is a pull time, not content, so it never counts as a change.
function normalize(text: string): string {
  try {
    const value = JSON.parse(text);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      delete value.generatedAt;
      return JSON.stringify(value);
    }
  } catch {
    // Not JSON: compare as-is.
  }
  return text;
}

// Writes only when the content differs (ignoring generatedAt). Returns
// whether it wrote.
export function writeFileIfChanged(file: string, text: string): boolean {
  try {
    if (normalize(fs.readFileSync(file, 'utf-8')) === normalize(text)) {
      return false;
    }
  } catch {
    // Missing: write it.
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  return true;
}

// Makes `dir` hold exactly `files` (name -> text), touching only files whose
// content changed. Returns whether anything changed.
export function syncDir(dir: string, files: Record<string, string>): boolean {
  let changed = false;
  fs.mkdirSync(dir, { recursive: true });
  for (const name of fs.readdirSync(dir)) {
    if (!(name in files)) {
      fs.rmSync(path.join(dir, name), { recursive: true, force: true });
      changed = true;
    }
  }
  for (const [name, text] of Object.entries(files)) {
    changed = writeFileIfChanged(path.join(dir, name), text) || changed;
  }
  return changed;
}
