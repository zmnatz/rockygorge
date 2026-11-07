import snapshot from '../../public/data/club-pages.json';
import type { ClubPage } from '@/utils/rugbyXplorer';

/** The nightly list of each club's Rugby Xplorer page and crest, by club name
 *  (scripts/generate-club-pages.ts). Part of the bundle, because every crest on
 *  the site reads it. */
export const clubPages: Record<string, ClubPage | undefined> = snapshot.clubs;
