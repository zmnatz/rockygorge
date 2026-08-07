import { describe, it, expect } from 'vitest';
import { generateLabel } from '@/utils/labels';

describe('generateLabel', () => {
  it('converts camelCase to Space Case', () => {
    expect(generateLabel('defaultAmount')).toBe('Default Amount');
  });

  it('converts snake_case to Space Case', () => {
    expect(generateLabel('hide_summary')).toBe('Hide summary');
  });

  it('capitalizes the first letter', () => {
    expect(generateLabel('name')).toBe('Name');
  });

  it('handles special case "id"', () => {
    expect(generateLabel('id')).toBe('ID');
  });

  it('handles special case "href"', () => {
    expect(generateLabel('href')).toBe('Href');
  });

  it('returns empty string for empty input', () => {
    expect(generateLabel('')).toBe('');
  });

  it('handles single word', () => {
    expect(generateLabel('title')).toBe('Title');
  });

  it('handles mixed camelCase and snake_case', () => {
    expect(generateLabel('form_id')).toBe('Form id');
  });
});
