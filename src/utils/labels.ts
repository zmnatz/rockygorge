export function generateLabel(name: string) {
  if (!name) return '';
  
  // Special cases
  const specialCases: Record<string, string> = {
    id: 'ID',
    href: 'Href',
  };
  if (specialCases[name]) return specialCases[name];

  // camelCase or snake_case to Space Case
  const result = name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^[a-z]/, (match) => match.toUpperCase());

  return result;
}
