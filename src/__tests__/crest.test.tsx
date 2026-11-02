import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Crest } from '@/components/Crest';
import {
  crestFileName,
  crestSrc,
  isPlaceholderCrest,
  teamAbbreviation,
} from '@/utils/crest';

describe('crestFileName', () => {
  it('maps CMS team URLs to local webp files', () => {
    expect(
      crestFileName(
        'https://dpf0m541u9zk8.cloudfront.net/ru/team/91273.png?v=1711648057226'
      )
    ).toBe('91273.webp');
  });

  it('returns null for unrecognized patterns', () => {
    expect(crestFileName('https://example.com/logo.svg')).toBeNull();
    expect(crestFileName('')).toBeNull();
  });
});

describe('crestSrc', () => {
  it('returns the local snapshot path for known teams', () => {
    expect(
      crestSrc('https://dpf0m541u9zk8.cloudfront.net/ru/team/91273.png?v=1')
    ).toBe('/crests/91273.webp');
  });

  it('passes through unknown or empty URLs for remote fallback', () => {
    expect(crestSrc('https://example.com/logo.svg')).toBe(
      'https://example.com/logo.svg'
    );
    expect(crestSrc('')).toBe('');
    expect(crestSrc(undefined)).toBe('');
  });

  it('returns remote URLs directly in development (no snapshots yet)', () => {
    vi.stubEnv('NODE_ENV', 'development');
    try {
      expect(
        crestSrc('https://dpf0m541u9zk8.cloudfront.net/ru/team/91273.png?v=1')
      ).toBe('https://dpf0m541u9zk8.cloudfront.net/ru/team/91273.png?v=1');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe('teamAbbreviation', () => {
  it('builds short codes from team names', () => {
    expect(teamAbbreviation('Rocky Gorge MD3')).toBe('RGM');
    expect(teamAbbreviation('NOVA MD3')).toBe('NM');
  });
});

describe('isPlaceholderCrest', () => {
  it('detects the shared generic CMS badge', () => {
    expect(
      isPlaceholderCrest(
        'https://d26phqdbpt0w91.cloudfront.net/NonVideo/d89f330c-59ec-44cb-b7c1-f23052bfa9ee.png'
      )
    ).toBe(true);
  });

  it('passes real team logos and empty values through', () => {
    expect(
      isPlaceholderCrest('https://dpf0m541u9zk8.cloudfront.net/ru/team/91273.png?v=1')
    ).toBe(false);
    expect(isPlaceholderCrest('')).toBe(false);
    expect(isPlaceholderCrest(undefined)).toBe(false);
  });
});

describe('Crest', () => {
  const remote = 'https://dpf0m541u9zk8.cloudfront.net/ru/team/91273.png?v=1';

  it('renders the remote image in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    try {
      const html = renderToStaticMarkup(
        <Crest src={remote} alt="Rocky Gorge" name="Rocky Gorge MD3" />
      );
      expect(html).toContain(`src="${remote}"`);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('renders the local snapshot path outside development', () => {
    const html = renderToStaticMarkup(
      <Crest src={remote} alt="Rocky Gorge" name="Rocky Gorge MD3" />
    );
    expect(html).toContain('src="/crests/91273.webp"');
  });

  it('renders nothing without a source', () => {
    expect(renderToStaticMarkup(<Crest src="" alt="Nobody" />)).toBe('');
  });

  it('renders an initials avatar for the generic placeholder badge', () => {
    const html = renderToStaticMarkup(
      <Crest
        src="https://d26phqdbpt0w91.cloudfront.net/NonVideo/d89f330c-59ec-44cb-b7c1-f23052bfa9ee.png"
        alt="Stingers"
        name="Stingers WD3"
      />
    );
    expect(html).not.toContain('<img');
    expect(html).toContain('>SW</div>');
  });
});
