import fs from 'node:fs';
import path from 'node:path';
import { fetchLiveScores } from '../src/api/scores';

async function generate() {
  console.log('Building scores snapshot for static export...');
  const scores = await fetchLiveScores();
  const outDir = path.join(process.cwd(), 'public', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'scores.json'), JSON.stringify(scores));
  console.log(`Saved ${scores.length} scores to public/data/scores.json`);
}

generate().catch((err) => {
  console.error('Failed to generate scores snapshot:', err);
  process.exit(1);
});
