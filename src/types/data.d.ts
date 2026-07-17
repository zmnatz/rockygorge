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
 */
export interface BaseContentItem {
  slug: string;
  title: string;
  description: string;
  summary: string;
  details?: string;
  hide?: boolean;
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

/** A row in the Gauntlet leaderboard. */
export interface GauntletEntry {
  name: string;
  position?: string;
  time: string;
  stroke?: number;
}

// ── YAML module declarations ────────────────────────────────────────

declare module '@/data/events.yml' {
  const events: Event[];
  export default events;
}

declare module '*.yml' {
  const content: any;
  export default content;
}

declare module '@/data/forms.yml' {
  const forms: Form[];
  export default forms;
}

declare module '@/data/store.yml' {
  const store: Product[];
  export default store;
}

declare module '@/data/links.yml' {
  const links: Link[];
  export default links;
}

declare module '@/data/gauntlet.yml' {
  const gauntlet: GauntletEntry[];
  export default gauntlet;
}

declare module '@/data/gauntlet-2023-2024.yml' {
  const gauntlet2023: GauntletEntry[];
  export default gauntlet2023;
}

declare module '../../src/data/forms.yml' {
  const forms: Form[];
  export default forms;
}

declare module '../../src/data/gauntlet.yml' {
  const gauntlet: GauntletEntry[];
  export default gauntlet;
}
