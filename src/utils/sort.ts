export type SortDirection = 'asc' | 'desc';

function isMissing(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/** Compare two comparable values for a sort; used by sortable tables.
 *  `null`/`undefined` values sort last regardless of direction. */
export function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
  const aMissing = isMissing(a);
  const bMissing = isMissing(b);
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  if (a === b) return 0;
  const comparison = a < b ? -1 : 1;
  return direction === 'asc' ? comparison : -comparison;
}
