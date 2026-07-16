import linkMappings from '@/data/link_mappings.yml';

export function getLinkText(type: 'store' | 'forms', item: { info?: string; description?: string; title?: string }) {
  const mapping = linkMappings[type];
  const text = (item.info || item.description || item.title || "").toLowerCase();

  for (const [label, pattern] of Object.entries(mapping.mappings)) {
    if (new RegExp(pattern as string, 'i').test(text)) {
      return label;
    }
  }
  return mapping.default;
}
