import { describe, it, expect } from 'vitest';
import type { PracticeField } from '@/types/practice-field';
import { findPracticeField } from '@/utils/practice-fields';

const fields: PracticeField[] = [
  {
    id: 'laurel',
    matches: ['Laurel', 'Supplee'],
    extensionId: 15,
    label: 'All Other Rectangular Fields NORTH of Central Avenue',
    lat: 39.1168,
    lon: -76.8876,
  },
  {
    id: 'beltsville',
    matches: ['Beltsville', 'Sellman'],
    extensionId: 23,
    label: 'Beltsville CC Rectangle',
    lat: 39.0383,
    lon: -76.9323,
  },
];

describe('findPracticeField', () => {
  it('matches the Laurel practice location', () => {
    const result = findPracticeField('16650 Supplee Ln, Laurel, MD 20707, USA', fields);
    expect(result?.id).toBe('laurel');
  });

  it('matches the Beltsville practice location', () => {
    const result = findPracticeField('Beltsville Community Center, 3900 Sellman Rd, Beltsville, MD 20705, USA', fields);
    expect(result?.id).toBe('beltsville');
  });

  it('matches case-insensitively', () => {
    const result = findPracticeField('PRACTICE AT BELTSVILLE', fields);
    expect(result?.id).toBe('beltsville');
  });

  it('returns undefined for locations that are not club fields', () => {
    const result = findPracticeField('White Plains, NY, USA', fields);
    expect(result).toBeUndefined();
  });

  it('returns undefined when no location is present', () => {
    expect(findPracticeField(undefined, fields)).toBeUndefined();
    expect(findPracticeField('', fields)).toBeUndefined();
  });
});
