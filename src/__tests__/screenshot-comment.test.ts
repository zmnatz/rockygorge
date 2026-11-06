import { describe, expect, it } from 'vitest';
import { buildComment, COMMENT_MARKER } from '../../scripts/lib/screenshot-comment';

const base = {
  imageBaseUrl: 'https://raw.githubusercontent.com/o/r/pr-screenshots/pr-7/abc123',
  runUrl: 'https://github.com/o/r/actions/runs/1',
  previewUrl: 'https://deploy-preview-7--x.netlify.app',
  sha: 'abc1234567',
};

const page = (path: string, over = {}) => ({
  path,
  url: `${base.previewUrl}${path}`,
  status: 200,
  shots: [`${path === '/' ? 'home' : path.slice(1)}-desktop.png`, `${path === '/' ? 'home' : path.slice(1)}-mobile.png`],
  findings: [],
  notes: [],
  ...over,
});

describe('buildComment', () => {
  it('starts with the marker so the comment can be updated in place', () => {
    expect(buildComment({ ...base, pages: [page('/')] }).startsWith(COMMENT_MARKER)).toBe(true);
  });

  it('embeds every shot inline from the image base url and links the run', () => {
    const body = buildComment({ ...base, pages: [page('/'), page('/gameday')] });
    expect(body).toContain(`![/ desktop](${base.imageBaseUrl}/home-desktop.png)`);
    expect(body).toContain(`![/gameday mobile](${base.imageBaseUrl}/gameday-mobile.png)`);
    expect(body).toContain(base.runUrl);
    expect(body).toContain('abc1234');
  });

  it('says when only the home page was captured', () => {
    expect(buildComment({ ...base, pages: [page('/')] })).toContain('Only the home page was captured');
    expect(buildComment({ ...base, pages: [page('/'), page('/x')] })).not.toContain('Only the home page');
  });

  it('lists notes and findings per page, or says there were none', () => {
    const body = buildComment({
      ...base,
      pages: [
        page('/', { findings: [{ kind: 'console', text: 'boom' }], notes: ['mobile: timed out waiting for #x'] }),
        page('/gameday'),
      ],
    });
    expect(body).toContain('`console` boom');
    expect(body).toContain('timed out waiting for #x');
    expect(body).toContain('No console errors');
  });

  it('flags a non-200 page', () => {
    expect(buildComment({ ...base, pages: [page('/', { status: 404 })] })).toContain('HTTP 404');
  });
});
