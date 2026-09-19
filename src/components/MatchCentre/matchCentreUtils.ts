import type { MatchPlayer } from '@/types/match';

export function isSubstitutionEvent(type: string): boolean {
  return type.toLowerCase().includes('substitut');
}

export function isScoreEvent(type: string): boolean {
  const normalized = type.toLowerCase();
  return (
    normalized.includes('try') ||
    normalized.includes('conversion') ||
    normalized.includes('goal')
  );
}

export function parseSubstitution(comment: string): { on: string; off: string } | null {
  const match = comment.match(/off:\s*(.+?),\s*on:\s*(.+?)\s*$/i);
  if (!match) {
    return null;
  }
  return { off: match[1].trim(), on: match[2].trim() };
}

export function parseScoringEvent(comment: string): { eventType: string; player: string } | null {
  const match = comment.match(/^(.+?)\s*-\s*(.+?)$/);
  if (!match) {
    return null;
  }
  return { eventType: match[1].trim(), player: match[2].trim() };
}

export function sortByShirtNumber(players: MatchPlayer[] | undefined): MatchPlayer[] {
  return [...(players || [])].sort(
    (a, b) => parseInt(a.shirtNumber || '0', 10) - parseInt(b.shirtNumber || '0', 10)
  );
}

export function nameInSet(name: string, set: Set<string>): boolean {
  const normalized = name.toLowerCase();
  if (set.has(normalized)) {
    return true;
  }
  const lastName = normalized.split(/\s+/).pop();
  if (!lastName) {
    return false;
  }
  for (const entry of set) {
    if (entry.split(/\s+/).pop() === lastName) {
      return true;
    }
  }
  return false;
}
