import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';

// The site's routes, read from its files, so a test can check that proxy.ts redirects
// every mixed-case route's lowercase address (docs/adr/014-nextjs-runtime.md).

/** The content files whose slugs are routes, by the path they're under. */
const SLUG_ROUTES: [prefix: string, file: string][] = [
  ['', 'content/store.yml'],
  ['/events', 'content/events.yml'],
  ['/forms', 'content/forms.yml'],
];

const PAGE_FILE = /^(?!_|\[)(.+)\.(tsx|ts|jsx|js|mdx|md)$/;

/** The site's routes that could have a capital in them: each page file under `pages/`
 *  that isn't a dynamic route, and each content item with a page of its own. */
export function siteRoutes(root: string): string[] {
  const pages = (dir: string, prefix: string): string[] =>
    readdirSync(path.join(root, 'pages', dir), { withFileTypes: true }).flatMap((entry) => {
      if (entry.isDirectory()) {
        return entry.name.startsWith('[') ? [] : pages(path.join(dir, entry.name), `${prefix}/${entry.name}`);
      }
      const name = PAGE_FILE.exec(entry.name)?.[1];
      return name ? [name === 'index' ? prefix || '/' : `${prefix}/${name}`] : [];
    });
  const slugs = SLUG_ROUTES.flatMap(([prefix, file]) =>
    ((load(readFileSync(path.join(root, file), 'utf8')) as { slug?: string }[] | null) ?? []).flatMap((item) =>
      item?.slug ? [`${prefix}/${item.slug}`] : [],
    ),
  );
  return [...new Set([...pages('', ''), ...slugs])];
}

/** The routes with a capital in them. */
export const mixedCaseRoutes = (routes: string[]) => routes.filter((route) => route !== route.toLowerCase());
