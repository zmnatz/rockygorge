/** The store item slug is carried through PayPal as a trailing ` [slug]` tag
 *  on the order's line-item name and description (see ADR 005). Writing and
 *  reading the tag both live here so the two sides cannot drift apart. */

const ITEM_SLUG_PATTERN = /\s*\[([a-z0-9][a-z0-9-]*)\]$/;

export function formatItemSlugTag(slug: string): string {
  return ` [${slug}]`;
}

export function parseItemSlugTag(title: string): { itemSlug: string; itemTitle: string } {
  const match = title.match(ITEM_SLUG_PATTERN);
  if (!match) return { itemSlug: '', itemTitle: title };
  return { itemSlug: match[1], itemTitle: title.replace(ITEM_SLUG_PATTERN, '') };
}
