/**
 * Base for content-heavy items displayed on the homepage with a detail page.
 * Used by: Event, Product (store items).
 *
 * - slug: URL-safe identifier, used as the route param (e.g. /events/{slug})
 * - title: Display heading on detail pages and cards
 * - description: Longer text used for <meta> tags and subheadings (SEO)
 * - summary: Short card body text shown on the homepage
 * - details: Optional markdown rendered as HTML on the detail page
 * - hide: When true, excluded from the public homepage and listing
 * - location: Snapshot of the source calendar item's location,
 *   copied at generation time; not used for rendering
 * - start: Snapshot of the source calendar item's start,
 *   copied at generation time; not used for rendering
 * - end: Snapshot of the source calendar item's end,
 *   copied at generation time; not used for rendering
 */
export interface BaseContentItem {
  slug: string;
  title: string;
  description: string;
  summary: string;
  details?: string;
  hide?: boolean;
  location?: string;
  start?: string;
  end?: string;
}

/**
 * Base for items that navigate elsewhere via a direct link.
 * Used by: Form (Google Forms embeds), Link (toolbar/header nav).
 *
 * - slug: URL-safe identifier, used as the route param (e.g. /forms/{slug})
 * - href: Full path the item links to (e.g. /contacts, forms/banquet)
 * - title: Display text in navigation and cards
 * - summary: Short description shown on cards; also used as tooltip in toolbar
 * - hide: When true, excluded from the public homepage
 */
export interface BaseNavigableItem {
  slug: string;
  href: string;
  title: string;
  summary: string;
  hide?: boolean;
}

/** An event listing (e.g. Rocky Gorge Open). */
export interface Event extends BaseContentItem {
  organizers: string[];
}

/** A Google Forms embed page. */
export interface Form extends BaseNavigableItem {
  formId: string;
  width: number;
  height: number;
  formLink?: string;
}

/** A purchasable store item (banquet tickets, gear, donations, etc.). */
export interface Product extends BaseContentItem {
  defaultAmount: number;
  options: Array<{ name: string; value: number }>;
  donation?: boolean;
  supporters?: string[];
  flexiblePayment?: boolean;
  children?: React.ReactNode;
  subscriptions?: Array<{
    name: string;
    id: string;
    description: string;
    options: Array<{ label: string; value: string }>;
    value?: string;
  }>;
}

/** A toolbar/header navigation link. */
export interface Link extends BaseNavigableItem {
  header: boolean;
}

/** A record of a member who has paid club dues. */
export interface Dues {
  name: string;
  monthly?: boolean;
  date: string;
}

/** A row in the Gauntlet leaderboard. */
export interface GauntletEntry {
  name: string;
  position?: string;
  time: string;
  stroke?: number;
}

/** The data source a homepage section draws its cards from. */
export type SectionSource = 'store' | 'events' | 'links';

/** A homepage card derived from a content item. */
export interface SectionCard {
  key: string;
  title: string;
  href: string;
  summary: string;
}

/**
 * Per-section card mapping in `content/home.yml`: which field becomes the card
 * title, and how the card href is built (from a slug with `hrefPrefix`, or read
 * directly from `hrefField`).
 */
export interface SectionCardConfig {
  titleField: 'title' | 'description';
  hrefPrefix?: string;
  hrefField?: 'href';
}
