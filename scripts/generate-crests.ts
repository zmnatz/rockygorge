import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { crestFileName } from '../src/utils/crest';

interface SnapshotScore {
  homeTeam: { crest: string };
  awayTeam: { crest: string };
}

// Snapshots CMS crest PNGs as small local WebP files so pages serve
// right-sized, long-cacheable images instead of 200px remote PNGs.
// Runs after generate:scores; per-team failures only warn (the Crest
// component falls back to the remote URL at runtime).
async function generate() {
  console.log('Snapshotting team crests for static export...');
  const snapshotPath = path.join(process.cwd(), 'public', 'data', 'scores.json');
  if (!fs.existsSync(snapshotPath)) {
    console.warn('No public/data/scores.json — run generate:scores first.');
    return;
  }
  const scores = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8')) as SnapshotScore[];
  const urls = [
    ...new Set(
      scores.flatMap((score) => [score.homeTeam.crest, score.awayTeam.crest]).filter(Boolean)
    ),
  ];
  const outDir = path.join(process.cwd(), 'public', 'crests');
  fs.mkdirSync(outDir, { recursive: true });

  let saved = 0;
  for (const url of urls) {
    const file = crestFileName(url);
    if (!file) {
      console.warn(`Skipping unrecognized crest URL: ${url}`);
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
  console.log(`Saved ${saved}/${urls.length} crests to public/crests/`);
}

generate().catch((err) => {
  console.error('Failed to generate crest snapshots:', err);
  process.exit(1);
});
