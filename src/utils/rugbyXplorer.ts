import { isPlaceholderCrest } from '@/utils/crest';

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

/** Rugby Xplorer's front page, for a club with no known page. */
export const RUGBY_XPLORER_URL = SITE;

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
  crest: string | null;
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

/** A club's confirmed Rugby Xplorer page and real crest, if it has them. */
export interface ClubPage {
  slug: string | null;
  crest: string | null;
  /** When the CMS was last asked. */
  checkedAt?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** A confirmed page rarely moves; an unconfirmed club may have since got one. */
const CONFIRMED_RECHECK_MS = 30 * DAY_MS;
const UNCONFIRMED_RECHECK_MS = 7 * DAY_MS;

/** Whether to ask the CMS about a playing club again. */
export function clubPageIsDue(saved: ClubPage | undefined, now: Date = new Date()): boolean {
  if (!saved?.checkedAt) return true;
  const age = now.getTime() - new Date(saved.checkedAt).getTime();
  return age >= (saved.slug ? CONFIRMED_RECHECK_MS : UNCONFIRMED_RECHECK_MS);
}

/** The first candidate the CMS confirms is this club: by id from its crest when
 *  it has one, otherwise by name, since a wrong link is worse than no link. */
export async function resolveClubPage(
  candidates: string[],
  entityId: string | null,
  clubName: string,
  lookup: (slug: string) => Promise<CmsEntity>,
): Promise<ClubPage | null> {
  for (const slug of candidates) {
    const entity = await lookup(slug);
    const confirmed = entityId
      ? entity.id === entityId
      : entity.id !== null &&
        entity.type === 'club' &&
        clubWords(entity.name ?? '') === clubWords(clubName);
    if (confirmed) {
      const crest = entity.crest && !isPlaceholderCrest(entity.crest) ? entity.crest : null;
      return { slug, crest };
    }
  }
  return null;
}
