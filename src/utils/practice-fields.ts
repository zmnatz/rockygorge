import type { PracticeField } from "@/types/practice-field";

/**
 * Associates a practice's calendar location string with a known PracticeField
 * by case-insensitive substring match against the field's configured keywords.
 */
export function findPracticeField(
  location: string | undefined,
  fields: PracticeField[],
): PracticeField | undefined {
  if (!location) return undefined;
  const lower = location.toLowerCase();
  return fields.find((field) =>
    field.matches.some((keyword) => lower.includes(keyword.toLowerCase())),
  );
}
