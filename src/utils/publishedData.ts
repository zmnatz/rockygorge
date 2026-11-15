import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Reads a file under public/data from getStaticProps, at build time and when a page is
// revalidated in its function (ADR 016). Never import this from code that runs in the
// browser.
//
// The build, `next start` and `next dev` read the disk. A deployed function doesn't carry
// public/data (next.config.ts excludes it), so it reads the same file from its own deploy
// on the CDN, at the permalink the build recorded in PUBLISHED_DATA_URL.

/** How often a page built from the nightly snapshots is regenerated, so what depends on the
 *  clock (the next game, a match day, a recap window) follows it between deploys. */
export const REVALIDATE_SECONDS = 60 * 60;

// Not traced: tracing a path built at run time would carry the whole project.
const defaultRoot = () => path.join(/* turbopackIgnore: true */ process.cwd(), 'public', 'data');

/** The JSON file at `file` (relative to public/data), or null when there is none. Anything
 *  else that goes wrong throws. `root` and `baseUrl` are for tests. */
export async function readPublishedJson<T>(
  file: string,
  root = defaultRoot(),
  baseUrl = process.env.PUBLISHED_DATA_URL
): Promise<T | null> {
  if (!existsSync(root) && baseUrl) {
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/${file}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
    return (await res.json()) as T;
  }
  try {
    return JSON.parse(await readFile(path.join(root, file), 'utf8')) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
