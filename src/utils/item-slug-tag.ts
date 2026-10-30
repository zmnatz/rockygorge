/** The store item slug is carried through PayPal as a trailing ` [item:slug]`
 *  tag on the order's line-item name and description (see ADR 009). The
 *  `item:` prefix keeps the tag from matching ordinary bracketed title text
 *  such as `[2-day]`. Writing and reading the tag both live here so the two
 *  sides cannot drift apart. */

const ITEM_SLUG_PATTERN = /\s*\[item:([a-z0-9][a-z0-9-]*)\]$/;

export function formatItemSlugTag(slug: string): string {
  return ` [item:${slug}]`;
}

export function parseItemSlugTag(title: string): { itemSlug: string; itemTitle: string } {
  const match = title.match(ITEM_SLUG_PATTERN);
  if (!match) return { itemSlug: '', itemTitle: title };
  return { itemSlug: match[1], itemTitle: title.replace(ITEM_SLUG_PATTERN, '') };
}
