import { createPublishedClient, type PublishedClient } from '@zmnatz/usa-club-rugby-data';

/** The CMS ids the USA Club Rugby eligibility site has a player page for: everyone in this
 *  season's record or a Locked Season's. Its other ids are 404s there (coaches, and players
 *  only in competitions it doesn't assess), so the player page links only these (ADR 015).
 *  Throws if the published data can't be read, so the caller keeps its previous snapshot. */
export async function eligibilityPlayerIds(
  client: Pick<PublishedClient, 'playerIndex' | 'pastPlayerIds'> = createPublishedClient()
): Promise<Set<string>> {
  const [current, past] = await Promise.all([client.playerIndex(), client.pastPlayerIds()]);
  return new Set([...Object.keys(current.players), ...Object.keys(past)]);
}
