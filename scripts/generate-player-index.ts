import fs from 'node:fs';
import path from 'node:path';
import { buildPlayerHistories } from '../src/utils/playerHistory';

async function generate() {
  console.log('Building player histories for static export...');
  const histories = await buildPlayerHistories({ concurrency: 3 });
  const plainObj = Object.fromEntries(histories);
  const outDir = path.join(process.cwd(), 'public', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'players.json'),
    JSON.stringify(plainObj, null, 2)
  );
  console.log(`Saved ${histories.size} player histories to public/data/players.json`);
}

generate().catch((err) => {
  console.error('Failed to generate player histories:', err);
  process.exit(1);
});
