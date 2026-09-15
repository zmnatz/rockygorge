import { describe, expect, it } from 'vitest';
import { crestFileName, crestSrc } from '@/utils/crest';

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
});
