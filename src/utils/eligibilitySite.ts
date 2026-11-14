// The USA Club Rugby eligibility site, which holds the eligibility report (ADR 015).
// It keys players by the same CMS id as the player pages here.

export const ELIGIBILITY_SITE = 'https://usa-club-rugby-eligibility.netlify.app';

/** The player's page on the eligibility site: this season's verdicts, or their newest
 *  Locked Season. */
export function eligibilityPlayerUrl(playerId: string): string {
  return `${ELIGIBILITY_SITE}/player/${encodeURIComponent(playerId)}/`;
}
