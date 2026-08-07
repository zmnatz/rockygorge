import { describe, it, expect } from 'vitest';
import { parseTime } from '@/utils/gauntlet';

describe('parseTime', () => {
  it('returns number directly if input is a number', () => {
    expect(parseTime(120)).toBe(120);
    expect(parseTime(0)).toBe(0);
    expect(parseTime(90.5)).toBe(90.5);
  });

  it('parses "MM:SS" format correctly', () => {
    expect(parseTime('1:30')).toBe(90);
    expect(parseTime('2:00')).toBe(120);
    expect(parseTime('0:45')).toBe(45);
  });

  it('parses "MM:SS.s" with decimal seconds', () => {
    expect(parseTime('1:30.5')).toBe(90.5);
    expect(parseTime('2:15.25')).toBe(135.25);
  });

  it('returns 999999 for invalid format (missing colon)', () => {
    expect(parseTime('invalid')).toBe(999999);
  });

  it('returns 999999 for empty string', () => {
    expect(parseTime('')).toBe(999999);
  });

  it('returns NaN for format with missing minutes', () => {
    expect(parseTime(':30')).toBeNaN();
  });

  it('returns NaN for format with missing seconds', () => {
    expect(parseTime('1:')).toBeNaN();
  });
});
