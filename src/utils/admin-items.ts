interface DefaultField {
  name: string | number | symbol;
  type?: string;
}

export function createDefaultItem(
  fields: DefaultField[],
  pageDefaults: Record<string, unknown> = {}
): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const field of fields) {
    const name = String(field.name);
    switch (field.type) {
      case 'number':
        break;
      case 'boolean':
        item[name] = name === 'hide';
        break;
      case 'keyValueMap':
      case 'textKeyValueMap':
      case 'textList':
        item[name] = [];
        break;
      case 'text':
      case 'textarea':
      default:
        item[name] = '';
        break;
    }
  }
  return { ...item, ...pageDefaults };
}

export function validateItemId<T>(
  items: T[],
  candidate: T,
  originalId: string | null,
  getId: (item: T) => string,
  idLabel = 'id'
): string | null {
  const id = getId(candidate);
  const normalizedId = typeof id === 'string' ? id.trim() : '';
  if (!normalizedId) {
    return `The ${idLabel} must not be blank.`;
  }
  const normalizedOriginalId = originalId === null ? null : String(originalId).trim();
  const isDuplicate = items.some((item) => {
    const otherId = String(getId(item)).trim();
    if (normalizedOriginalId !== null && otherId === normalizedOriginalId) return false;
    return otherId === normalizedId;
  });
  if (isDuplicate) {
    return `An item with the ${idLabel} "${id}" already exists.`;
  }
  return null;
}

export function applyItemChange<T>(
  items: T[],
  editingItem: T,
  originalId: string | null,
  getId: (item: T) => string
): T[] {
  if (originalId === null) {
    return [...items, editingItem];
  }
  return items.map((item) => (getId(item) === originalId ? editingItem : item));
}

export function removeItemById<T>(
  items: T[],
  id: string,
  getId: (item: T) => string
): T[] {
  return items.filter((item) => getId(item) !== id);
}
