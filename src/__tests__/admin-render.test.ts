import { describe, it, expect } from 'vitest';
import { RENDER_MAPPINGS } from '@/utils/admin-config';

describe('RENDER_MAPPINGS', () => {
  describe('boolean', () => {
    it('returns "Yes" for truthy values', () => {
      expect(RENDER_MAPPINGS.boolean({ hide: true }, 'hide')).toBe('Yes');
      expect(RENDER_MAPPINGS.boolean({ hide: 1 }, 'hide')).toBe('Yes');
      expect(RENDER_MAPPINGS.boolean({ hide: 'yes' }, 'hide')).toBe('Yes');
    });

    it('returns "No" for falsy values', () => {
      expect(RENDER_MAPPINGS.boolean({ hide: false }, 'hide')).toBe('No');
      expect(RENDER_MAPPINGS.boolean({ hide: 0 }, 'hide')).toBe('No');
      expect(RENDER_MAPPINGS.boolean({ hide: '' }, 'hide')).toBe('No');
      expect(RENDER_MAPPINGS.boolean({}, 'hide')).toBe('No');
    });
  });

  describe('calendarMatches', () => {
    it('returns matches when available', () => {
      expect(RENDER_MAPPINGS.calendarMatches({ matches: 'Rugby' }, '')).toBe('Rugby');
    });

    it('falls back to notMatches', () => {
      expect(RENDER_MAPPINGS.calendarMatches({ notMatches: 'Social' }, '')).toBe('Social');
    });

    it('returns dash when neither present', () => {
      expect(RENDER_MAPPINGS.calendarMatches({}, '')).toBe('-');
    });
  });

  describe('default', () => {
    it('returns the field value', () => {
      expect(RENDER_MAPPINGS.default({ name: 'Test' }, 'name')).toBe('Test');
    });
  });
});
