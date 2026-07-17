import { describe, it, expect } from 'vitest';
import { slugify } from '@/utils/slugify';

describe('slugify', () => {
  it('converts text to lowercase', () => {
    expect(slugify('HELLO')).toBe('hello');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('trims whitespace', () => {
    expect(slugify('  hello  ')).toBe('hello');
  });

  it('removes non-word characters except hyphens', () => {
    expect(slugify('hello, world!')).toBe('hello-world');
    expect(slugify('test@#$%^&*')).toBe('test');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('hello--world')).toBe('hello-world');
    expect(slugify('hello---world')).toBe('hello-world');
  });

  it('handles multiple spaces', () => {
    expect(slugify('hello   world')).toBe('hello-world');
  });

  it('preserves single hyphens', () => {
    expect(slugify('hello-world')).toBe('hello-world');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('handles text with numbers', () => {
    expect(slugify('Event 2024')).toBe('event-2024');
  });

  it('handles mixed case with spaces and special chars', () => {
    expect(slugify('  Hello, World! 2024  ')).toBe('hello-world-2024');
  });
});
