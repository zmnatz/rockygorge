import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { crestFileName, isPlaceholderCrest } from '../src/utils/crest';
import { fetchAllCapitalFixtures } from '../src/api/capital';

interface SnapshotScore {
  homeTeam: { crest: string };
  awayTeam: { crest: string };
}

// Snapshots CMS crest PNGs as small local WebP files so pages serve
// right-sized, long-cacheable images instead of 200px remote PNGs.
// Covers Rocky Gorge's own snapshot plus every team in the Capital
// union-wide and club feeds, so league tables and scoreboards never 404.
// Runs after generate:scores; per-team failures only warn (the Crest
// component falls back to the remote URL, then an initials avatar, at
// runtime).
async function generate() {
  console.log('Snapshotting team crests for static export...');
  const urls = new Set<string>();
  const snapshotPath = path.join(process.cwd(), 'public', 'data', 'scores.json');
  if (fs.existsSync(snapshotPath)) {
    const scores = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8')) as SnapshotScore[];
    for (const score of scores) {
      if (score.homeTeam.crest) {
        urls.add(score.homeTeam.crest);
      }
      if (score.awayTeam.crest) {
        urls.add(score.awayTeam.crest);
      }
    }
  } else {
    console.warn('No public/data/scores.json — run generate:scores first.');
  }
  try {
    const fixtures = await fetchAllCapitalFixtures();
    for (const fixture of fixtures) {
      if (fixture.homeTeam.crest) {
        urls.add(fixture.homeTeam.crest);
      }
      if (fixture.awayTeam.crest) {
        urls.add(fixture.awayTeam.crest);
      }
    }
    console.log(`Found ${urls.size} unique team crests (scores + league feeds).`);
  } catch (err) {
    console.warn('Falling back to scores snapshot only:', (err as Error).message);
  }
  const outDir = path.join(process.cwd(), 'public', 'crests');
  fs.mkdirSync(outDir, { recursive: true });

  let saved = 0;
  let skipped = 0;
  for (const url of urls) {
    if (isPlaceholderCrest(url)) {
      continue;
    }
    const file = crestFileName(url);
    if (!file) {
      console.warn(`Skipping unrecognized crest URL: ${url}`);
      continue;
    }
    if (fs.existsSync(path.join(outDir, file))) {
      skipped += 1;
      continue;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const out = await sharp(buffer)
        .resize(96, 96, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      fs.writeFileSync(path.join(outDir, file), out);
      console.log(`Saved ${file} (${(out.length / 1024).toFixed(1)} KiB)`);
      saved += 1;
    } catch (err) {
      console.warn(`Failed to snapshot ${url}:`, (err as Error).message);
    }
  }
  console.log(`Saved ${saved} new crests (${skipped} already present) to public/crests/`);
}

generate().catch((err) => {
  // Best-effort like the other snapshots: missing local crests fall back to
  // remote URLs (then initials avatars) at runtime, so this must not fail
  // the build either.
  console.warn('Failed to generate crest snapshots:', (err as Error).message);
});
