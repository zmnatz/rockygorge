/**
 * A county-maintained field the club practices on, configured in
 * `config/practice-fields.yml`.
 *
 * - id: Stable identifier used for query keys and embed routing
 * - matches: Substrings matched (case-insensitive) against a practice's
 *   calendar location to associate it with this field
 * - extensionId: The field's extension number on the Prince George's County
 *   Parks Statusfy feed
 * - label: The county's display name for the field
 * - lat/lon: Coordinates used for the weather forecast at the field
 */
export interface PracticeField {
  id: string;
  matches: string[];
  extensionId: number;
  label: string;
  lat: number;
  lon: number;
}
