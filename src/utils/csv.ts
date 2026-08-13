export interface CsvColumn<T extends object> {
  key: keyof T;
  title: string;
}

function escapeCsvField(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Serialize rows into RFC 4180-style CSV (quoted where needed, CRLF rows). */
export function toCsv<T extends object>(
  columns: CsvColumn<T>[],
  rows: T[],
): string {
  const header = columns.map((col) => escapeCsvField(col.title)).join(',');
  const body = rows
    .map((row) => columns.map((col) => escapeCsvField(row[col.key])).join(','))
    .join('\r\n');
  return body ? `${header}\r\n${body}` : header;
}

/** Trigger a browser download of the given CSV text. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
