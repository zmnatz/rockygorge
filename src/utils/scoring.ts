export type ScoringKind = 'try' | 'conversion' | 'penaltyGoal' | 'dropGoal';

// Commentary types seen in the feed: "Try", "Conversion", "Conversion
// Unsuccessful", "Penalty Goal", "Penalty Goal Unsuccessful" and "Field
// Goal" (a drop goal). Missed kicks, substitutions and cards aren't scoring.
export function scoringKind(type: string): ScoringKind | null {
  const normalized = type.toLowerCase();
  if (normalized.includes('unsuccessful')) return null;
  if (normalized.startsWith('try')) return 'try';
  if (normalized.startsWith('conversion')) return 'conversion';
  if (normalized.startsWith('penalty goal')) return 'penaltyGoal';
  if (normalized.startsWith('field goal') || normalized.startsWith('drop goal')) {
    return 'dropGoal';
  }
  return null;
}
