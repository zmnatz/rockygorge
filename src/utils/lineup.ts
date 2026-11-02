export interface LineupPlayer {
  number: number;
  name: string;
  captain: boolean;
}

export interface ParsedRoster {
  players: LineupPlayer[];
  errors: string[];
}

export interface LineupData {
  division: string;
  homeTeam: string;
  awayTeam: string;
  subtitle: string;
  players: LineupPlayer[];
}

export const SAMPLE_ROSTER_TEXT = `BART VERMULEN 1
TRISTAN COLE 2
JT HAMMOND 3
SHEMAR LEWIS 4
TYLER TIPPETT 5
KEVIN KOCH 6
JAMES NUTLAND 7
(C) ADAM WILEY 8
9 BRANDON DRUMMOND
10 JAMISON HULBERT
11 DONTE SPEIGHT
12 PRESTON JONES
13 JULIAN ALVAREZ
14 JASON BLAND
15 DMONTAE NOBLE
16 SAM GREGOIRE - 17 MICKEY BRESSLER - 18 KRIS GOUGH
19 SEAMUS SIEFING - 20 JACK WARNICK
21 MIKE WILLIAMS - 22 JAKE RAMPOLLA - 23 JUSTIN SMITH`;

function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

function parseChunk(chunk: string): LineupPlayer | null {
  const trimmed = chunk.trim().replace(/^[-–—•|,;]+|[-–—•|,;]+$/g, '').trim();
  if (!trimmed) return null;

  const captain = /\(C\)/i.test(trimmed);
  const text = trimmed.replace(/\(C\)/gi, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return null;

  // Number-first: "9 Brandon Drummond" or "9. Brandon" or "9: Brandon"
  let m = text.match(/^(\d{1,2})[.):]?\s+(.+)$/);
  if (m) {
    const number = Number(m[1]);
    const name = cleanName(m[2]);
    if (!name || number < 1 || number > 99) return null;
    return { number, name, captain };
  }

  // Name-first: "Bart Vermulen 1"
  m = text.match(/^(.+?)\s+(\d{1,2})$/);
  if (m) {
    const name = cleanName(m[1]);
    const number = Number(m[2]);
    if (!name || number < 1 || number > 99) return null;
    return { number, name, captain };
  }

  return null;
}

export function parseRosterText(input: string): ParsedRoster {
  const errors: string[] = [];
  const found = new Map<number, LineupPlayer>();

  const lines = input.split(/\r?\n/);
  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Split multi-player lines (finishers rows):
    // "16 A - 17 B - 18 C", "19 A / 20 B", "21 A, 22 B", "21 A | 22 B"
    const chunks = trimmedLine
      .split(/\s*\|\s*|\s*•\s*|\s*\/\s*|\s+-\s+/)
      .flatMap((part) => part.split(/,\s*(?=(?:\(C\)\s*)?\d)/i));

    if (chunks.length > 1) {
      let parsedAny = false;
      for (const chunk of chunks) {
        const player = parseChunk(chunk);
        if (player) {
          parsedAny = true;
          if (found.has(player.number)) {
            errors.push(`Duplicate number ${player.number} (line ${lineIndex + 1}). Keeping first.`);
          } else {
            found.set(player.number, player);
          }
        }
      }
      if (!parsedAny) {
        const fallback = parseChunk(trimmedLine);
        if (fallback) {
          if (found.has(fallback.number)) {
            errors.push(`Duplicate number ${fallback.number} (line ${lineIndex + 1}). Keeping first.`);
          } else {
            found.set(fallback.number, fallback);
          }
        } else {
          errors.push(`Line ${lineIndex + 1}: could not parse "${trimmedLine}". Use "1 First Last" or "First Last 1".`);
        }
      }
      return;
    }

    const player = parseChunk(trimmedLine);
    if (player) {
      if (found.has(player.number)) {
        errors.push(`Duplicate number ${player.number} (line ${lineIndex + 1}). Keeping first.`);
      } else {
        found.set(player.number, player);
      }
    } else {
      errors.push(`Line ${lineIndex + 1}: could not parse "${trimmedLine}". Use "1 First Last" or "First Last 1".`);
    }
  });

  const players = [...found.values()].sort((a, b) => a.number - b.number);

  const numbers = new Set(players.map((p) => p.number));
  const missing: number[] = [];
  for (let n = 1; n <= 15; n++) {
    if (!numbers.has(n)) missing.push(n);
  }
  const missingBench: number[] = [];
  for (let n = 16; n <= 23; n++) {
    if (!numbers.has(n)) missingBench.push(n);
  }
  if (missing.length > 0 && players.length > 0) {
    errors.push(`Missing starter numbers: ${missing.join(', ')}.`);
  }
  if (missingBench.length > 0 && players.length > 0 && missingBench.length < 8) {
    errors.push(`Missing finisher numbers: ${missingBench.join(', ')}.`);
  }

  return { players, errors };
}

export function startersOf(players: LineupPlayer[]): LineupPlayer[] {
  return players.filter((p) => p.number >= 1 && p.number <= 15).sort((a, b) => a.number - b.number);
}

export function finishersOf(players: LineupPlayer[]): LineupPlayer[] {
  return players.filter((p) => p.number >= 16).sort((a, b) => a.number - b.number);
}

export function displayName(player: LineupPlayer): string {
  const upper = player.name.toUpperCase();
  return player.captain ? `(C) ${upper}` : upper;
}
