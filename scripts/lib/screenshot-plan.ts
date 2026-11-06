// Pure helpers for scripts/screenshots.ts: which pages to capture and which
// findings are worth reporting. Kept free of Playwright so they unit test.

export interface PageSpec {
  path: string;
  // Selector to wait for after the default network-idle settle.
  waitFor?: string;
  // Fixed extra delay, for pages that fill in on a timer.
  delayMs?: number;
}

export interface RouteRule {
  files: string[];
  routes: PageSpec[];
}

export interface Finding {
  kind: 'console' | 'pageerror' | 'request';
  text: string;
}

export interface NoiseRule {
  kind?: Finding['kind'];
  pattern: string;
  reason: string;
}

// Minimal glob: `**` crosses directories, `*` stays within one segment.
export function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '@@GLOBSTAR@@')
    .replace(/\*/g, '[^/]*')
    .replace(/@@GLOBSTAR@@/g, '.*');
  return new RegExp(`^${escaped}$`);
}

// One page per line, as in a PR's `## Screenshots` section:
//   - /gameday  wait: [data-testid=match-centre]
//   /x delay: 1500
export function parsePageSpec(line: string): PageSpec | null {
  const match = line.trim().replace(/^[-*]\s*/, '').match(/^(\/\S*)(.*)$/);
  if (!match) {
    return null;
  }
  const spec: PageSpec = { path: match[1] };
  const rest = match[2];
  const wait = rest.match(/\bwait:\s*(\S+)/);
  if (wait) {
    spec.waitFor = wait[1];
  }
  const delay = rest.match(/\bdelay:\s*(\d+)/);
  if (delay) {
    spec.delayMs = Number(delay[1]);
  }
  return spec;
}

// Reads the `## Screenshots` section of a PR description (any heading level,
// case-insensitive) up to the next heading. HTML comments are ignored, as is
// anything that is not a path line.
export function parseScreenshotsSection(body: string): PageSpec[] {
  const withoutComments = body.replace(/<!--[\s\S]*?-->/g, '');
  const pages: PageSpec[] = [];
  let inSection = false;
  for (const line of withoutComments.split(/\r?\n/)) {
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      inSection = heading[1].trim().toLowerCase() === 'screenshots';
      continue;
    }
    if (inSection) {
      const spec = parsePageSpec(line);
      if (spec) {
        pages.push(spec);
      }
    }
  }
  return pages;
}

// The home page always comes first, then routes for changed files, then
// explicit requests. Deduped by path; an explicit request wins over a rule.
export function planPages({
  changedFiles,
  rules,
  requested,
}: {
  changedFiles: string[];
  rules: RouteRule[];
  requested: PageSpec[];
}): PageSpec[] {
  const byPath = new Map<string, PageSpec>([['/', { path: '/' }]]);
  for (const rule of rules) {
    const matchers = rule.files.map(globToRegExp);
    if (changedFiles.some((file) => matchers.some((re) => re.test(file)))) {
      for (const route of rule.routes) {
        if (!byPath.has(route.path)) {
          byPath.set(route.path, route);
        }
      }
    }
  }
  for (const request of requested) {
    byPath.set(request.path, request);
  }
  return [...byPath.values()];
}

export function filterFindings(findings: Finding[], noise: NoiseRule[]): Finding[] {
  const compiled = noise.map((rule) => ({ kind: rule.kind, re: new RegExp(rule.pattern) }));
  return findings.filter(
    (finding) =>
      !compiled.some(({ kind, re }) => (!kind || kind === finding.kind) && re.test(finding.text))
  );
}
