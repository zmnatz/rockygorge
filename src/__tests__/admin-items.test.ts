import { describe, it, expect } from 'vitest';
import {
  applyItemChange,
  createDefaultItem,
  removeItemById,
  validateItemId,
} from '@/utils/admin-items';

const getId = (item: any) => item.slug;

describe('createDefaultItem', () => {
  const fields = [
    { name: 'slug', type: 'text' },
    { name: 'title', type: 'text' },
    { name: 'description', type: 'textarea' },
    { name: 'defaultAmount', type: 'number' },
    { name: 'hide', type: 'boolean' },
    { name: 'header', type: 'boolean' },
    { name: 'options', type: 'keyValueMap' },
    { name: 'supporters', type: 'textList' },
  ];

  it('defaults text and textarea fields to empty strings', () => {
    const item = createDefaultItem(fields);
    expect(item.slug).toBe('');
    expect(item.title).toBe('');
    expect(item.description).toBe('');
  });

  it('omits number fields unless supplied via page defaults', () => {
    const item = createDefaultItem(fields);
    expect('defaultAmount' in item).toBe(false);
  });

  it('defaults hide to true and other booleans to false', () => {
    const item = createDefaultItem(fields);
    expect(item.hide).toBe(true);
    expect(item.header).toBe(false);
  });

  it('defaults list and map fields to empty arrays', () => {
    const item = createDefaultItem(fields);
    expect(item.options).toEqual([]);
    expect(item.supporters).toEqual([]);
  });

  it('merges page-level defaults, overriding generated values', () => {
    const item = createDefaultItem(fields, { defaultAmount: 0, width: 640, height: 1000 });
    expect(item.defaultAmount).toBe(0);
    expect(item.width).toBe(640);
    expect(item.height).toBe(1000);
  });

  it('keeps page-level defaults for fields not in the field list', () => {
    const item = createDefaultItem([{ name: 'name', type: 'text' }], { extra: 'x' });
    expect(item.extra).toBe('x');
  });
});

describe('validateItemId', () => {
  const items = [
    { slug: 'banquet' },
    { slug: 'open' },
  ];

  it('returns null for a valid, unique id', () => {
    expect(validateItemId(items, { slug: 'dues' }, null, getId)).toBeNull();
  });

  it('returns an error for a blank id on create', () => {
    const error = validateItemId(items, { slug: '' }, null, getId, 'slug');
    expect(error).toContain('slug');
    expect(error).toContain('blank');
  });

  it('returns an error for a blank id on edit', () => {
    const error = validateItemId(items, { slug: '   ' }, 'banquet', getId, 'slug');
    expect(error).not.toBeNull();
  });

  it('returns an error when a new item collides with an existing id', () => {
    const error = validateItemId(items, { slug: 'open' }, null, getId);
    expect(error).toContain('already exists');
    expect(error).toContain('open');
  });

  it('blocks an id that collides with an existing id modulo whitespace', () => {
    expect(validateItemId(items, { slug: 'open ' }, null, getId)).not.toBeNull();
    expect(validateItemId(items, { slug: ' open' }, null, getId)).not.toBeNull();
  });

  it('returns an error when an existing item is renamed into a collision', () => {
    const error = validateItemId(items, { slug: 'open' }, 'banquet', getId);
    expect(error).not.toBeNull();
  });

  it('blocks a rename into a collision modulo whitespace', () => {
    expect(validateItemId(items, { slug: 'open  ' }, 'banquet', getId)).not.toBeNull();
  });

  it('allows editing an item with an unchanged id', () => {
    expect(validateItemId(items, { slug: 'banquet' }, 'banquet', getId)).toBeNull();
  });

  it('allows renaming an item to a new unique id', () => {
    expect(validateItemId(items, { slug: 'dues' }, 'banquet', getId)).toBeNull();
  });

  it('uses a default label when none is supplied', () => {
    const error = validateItemId(items, { slug: '' }, null, getId);
    expect(error).toContain('id');
  });
});

describe('applyItemChange', () => {
  it('appends a new item when originalId is null', () => {
    const items = [{ slug: 'banquet' }];
    const result = applyItemChange(items, { slug: 'open' }, null, getId);
    expect(result).toEqual([{ slug: 'banquet' }, { slug: 'open' }]);
  });

  it('does not mutate the original array when appending', () => {
    const items = [{ slug: 'banquet' }];
    applyItemChange(items, { slug: 'open' }, null, getId);
    expect(items).toHaveLength(1);
  });

  it('replaces the item matching the original id', () => {
    const items = [{ slug: 'banquet' }, { slug: 'open' }];
    const result = applyItemChange(items, { slug: 'banquet', hide: false }, 'banquet', getId);
    expect(result[0]).toEqual({ slug: 'banquet', hide: false });
    expect(result).toHaveLength(2);
  });

  it('supports renaming by replacing against the original id', () => {
    const items = [{ slug: 'banquet' }, { slug: 'open' }];
    const result = applyItemChange(items, { slug: 'dues' }, 'banquet', getId);
    expect(result[0].slug).toBe('dues');
    expect(result[1].slug).toBe('open');
  });

  it('leaves items untouched when the original id has no match', () => {
    const items = [{ slug: 'banquet' }];
    const result = applyItemChange(items, { slug: 'open' }, 'missing', getId);
    expect(result).toEqual([{ slug: 'banquet' }]);
  });
});

describe('removeItemById', () => {
  it('removes the item with the matching id', () => {
    const items = [{ slug: 'banquet' }, { slug: 'open' }];
    expect(removeItemById(items, 'open', getId)).toEqual([{ slug: 'banquet' }]);
  });

  it('leaves the array unchanged when no item matches', () => {
    const items = [{ slug: 'banquet' }];
    expect(removeItemById(items, 'missing', getId)).toEqual([{ slug: 'banquet' }]);
  });
});
