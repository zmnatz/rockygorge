import { describe, expect, it } from 'vitest';
import { eligibilityPlayerUrl } from '@/utils/eligibilitySite';

describe('eligibilityPlayerUrl', () => {
  it("links to the player's page on the eligibility site", () => {
    expect(eligibilityPlayerUrl('f5JqeT4vzmH2nxtnR')).toBe(
      'https://usa-club-rugby-eligibility.netlify.app/player/f5JqeT4vzmH2nxtnR/'
    );
  });

  it('encodes the id', () => {
    expect(eligibilityPlayerUrl('a/b c')).toBe('https://usa-club-rugby-eligibility.netlify.app/player/a%2Fb%20c/');
  });
});
