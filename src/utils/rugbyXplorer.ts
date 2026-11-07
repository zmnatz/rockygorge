// Links to Rugby Xplorer, and working out which of its pages belongs to a club.
// xplorer.rugby blocks automated clients, so club pages are found and confirmed
// through the CMS behind it, never by loading the site. See
// docs/adr/011-eligibility-for-one-side-clubs.md.

const SITE = 'https://xplorer.rugby';
/** The Capital union. A match report loads under any entity's path. */
const UNION_SLUG = 'capitalrugby';

export const CLUB_PAGES_FILE = 'club-pages.json';

/** The Rugby Xplorer match report for a fixture. CMS fixture ids are its ids. */
export function matchUrl(fixtureId: string, clubSlug: string | null): string {
  return `${SITE}/${clubSlug ?? UNION_SLUG}/match-centre/${encodeURIComponent(fixtureId)}?tab=Points-Summary`;
}

/** A club's fixtures and results on Rugby Xplorer, when its page is known. */
export function fixturesUrl(clubSlug: string | null): string | null {
  return clubSlug ? `${SITE}/${clubSlug}/fixtures-results` : null;
}

/** The list of Capital clubs, for a club with no known page. */
export const UNION_CLUBS_URL = `${SITE}/${UNION_SLUG}/clubs`;

/** The club id in a CMS-hosted crest URL, e.g. `.../ru/team/91273.png`. */
export function crestEntityId(crest: string): string | null {
  return crest.match(/\/team\/(\d+)\./)?.[1] ?? null;
}

export interface CmsSite {
  name: string;
  slug: string;
}

export interface CmsEntity {
  id: string | null;
  name: string | null;
  type: string | null;
}

const kebab = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** A club's name without the words that vary between its sides and its page. */
const clubWords = (name: string) =>
  name
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => !['rugby', 'club', 'rfc', 'men', 'women', 'inc'].includes(word))
    .join(' ');

/** Slugs a club's page might have, likeliest first. CMS sites are named
 *  `rx-<entity id>-<slug>`; other clubs have no site, so slugs are built from the
 *  name. resolveClubPage decides which, if any, is right. */
export function clubPageCandidates(
  clubName: string,
  gender: 'M' | 'W',
  sites: CmsSite[],
  entityId: string | null,
): string[] {
  // By name, a men's and a women's page both reduce to the club's name.
  const otherGender = new RegExp(`\\b${gender === 'W' ? 'men' : 'women'}\\b`, 'i');
  const fromSites = sites
    .filter((site) =>
      entityId
        ? site.slug.startsWith(`rx-${entityId}-`)
        : clubWords(site.name) === clubWords(clubName) && !otherGender.test(site.name),
    )
    .map((site) => site.slug.replace(/^rx-(?:\d+|club)-/, ''));
  const base = kebab(clubName);
  const suffix = gender === 'W' ? 'women' : 'men';
  return [
    ...new Set([
      ...fromSites,
      base,
      `${base}-rugby`,
      `${base}-${suffix}`,
      `${base}-rugby-${suffix}`,
      `${base}-rfc`,
    ]),
  ];
}

/** The first candidate the CMS confirms is this club: by id from its crest when
 *  it has one, otherwise by name, since a wrong link is worse than no link. */
export async function resolveClubPage(
  candidates: string[],
  entityId: string | null,
  clubName: string,
  lookup: (slug: string) => Promise<CmsEntity>,
): Promise<string | null> {
  for (const slug of candidates) {
    const entity = await lookup(slug);
    const confirmed = entityId
      ? entity.id === entityId
      : entity.id !== null &&
        entity.type === 'club' &&
        clubWords(entity.name ?? '') === clubWords(clubName);
    if (confirmed) return slug;
  }
  return null;
}

/** Club name to Rugby Xplorer slug, null when no page could be confirmed. */
export type ClubPages = Record<string, string | null>;

/** Loads the nightly club page list. Links are a convenience, so a missing or
 *  unreadable list only costs the links. */
export async function loadClubPages(): Promise<ClubPages> {
  try {
    const res = await fetch(`/data/${CLUB_PAGES_FILE}`);
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return {};
    return ((await res.json()) as { clubs?: ClubPages }).clubs ?? {};
  } catch {
    return {};
  }
}
