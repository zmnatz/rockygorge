import { describe, expect, it } from 'vitest';
import {
  filterFindings,
  globToRegExp,
  parsePageSpec,
  parseScreenshotsSection,
  planPages,
  type Finding,
} from '../lib/plan';

describe('globToRegExp', () => {
  it('matches ** across directories and * within one', () => {
    expect(globToRegExp('src/components/Scores/**').test('src/components/Scores/a/b.tsx')).toBe(true);
    expect(globToRegExp('pages/*.tsx').test('pages/gameday.tsx')).toBe(true);
    expect(globToRegExp('pages/*.tsx').test('pages/admin/x.tsx')).toBe(false);
  });
});

describe('parsePageSpec', () => {
  it('parses a bare path', () => {
    expect(parsePageSpec('/gameday')).toEqual({ path: '/gameday' });
  });

  it('parses an optional wait selector and delay, ignoring a leading dash', () => {
    expect(parsePageSpec('- /gameday  wait: [data-testid=match-centre]')).toEqual({
      path: '/gameday',
      waitFor: '[data-testid=match-centre]',
    });
    expect(parsePageSpec('/x delay: 1500')).toEqual({ path: '/x', delayMs: 1500 });
  });

  it('rejects lines that are not paths', () => {
    expect(parsePageSpec('')).toBeNull();
    expect(parsePageSpec('- not a path')).toBeNull();
  });
});

describe('planPages', () => {
  const rules = [
    { files: ['pages/gameday.tsx', 'src/utils/gameday.ts'], routes: [{ path: '/gameday' }] },
    { files: ['src/components/Scores/**'], routes: [{ path: '/' }, { path: '/gameday', waitFor: '#x' }] },
  ];

  it('always includes the home page first', () => {
    expect(planPages({ changedFiles: [], rules, requested: [] })).toEqual([{ path: '/' }]);
  });

  it('adds routes for changed files and merges explicit requests, deduped by path', () => {
    const pages = planPages({
      changedFiles: ['src/components/Scores/ScoreCard.tsx'],
      rules,
      requested: [{ path: '/standings' }, { path: '/gameday', delayMs: 500 }],
    });
    expect(pages.map((p) => p.path)).toEqual(['/', '/gameday', '/standings']);
    // An explicit request wins over a rule's options for the same path.
    expect(pages[1]).toEqual({ path: '/gameday', delayMs: 500 });
  });
});

describe('filterFindings', () => {
  const finding = (kind: Finding['kind'], text: string): Finding => ({ kind, text });

  it('drops findings matching a noise pattern of the same kind', () => {
    const kept = filterFindings(
      [finding('console', 'Failed to load resource: ads.example.com'), finding('console', 'boom'), finding('pageerror', 'ads.example.com')],
      [{ kind: 'console', pattern: 'ads\\.example\\.com', reason: 'third-party ads' }]
    );
    expect(kept.map((f) => f.text)).toEqual(['boom', 'ads.example.com']);
  });

  it('treats a pattern without a kind as matching every kind', () => {
    const kept = filterFindings([finding('request', 'GET favicon.ico 404')], [{ pattern: 'favicon', reason: 'no icon' }]);
    expect(kept).toEqual([]);
  });
});

describe('parseScreenshotsSection', () => {
  it('reads page lines from the Screenshots section only', () => {
    const body = [
      '## What',
      '- /not-this',
      '## Screenshots',
      '<!-- instructions',
      '- /commented-out',
      '-->',
      '- /',
      '- /gameday  wait: [data-testid=x]',
      'free text is ignored',
      '',
      '## Test plan',
      '- /also-not-this',
    ].join('\n');
    expect(parseScreenshotsSection(body)).toEqual([
      { path: '/' },
      { path: '/gameday', waitFor: '[data-testid=x]' },
    ]);
  });

  it('is empty when the section is missing or the body is empty', () => {
    expect(parseScreenshotsSection('## What\nstuff')).toEqual([]);
    expect(parseScreenshotsSection('')).toEqual([]);
  });

  it('accepts CRLF line endings and any heading level', () => {
    expect(parseScreenshotsSection('### screenshots\r\n- /x\r\n')).toEqual([{ path: '/x' }]);
  });
});
