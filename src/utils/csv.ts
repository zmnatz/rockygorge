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

/** Split RFC 4180-style CSV text into rows of raw fields.
 *  Handles quoted fields (commas, quotes, and newlines inside quotes) and
 *  CRLF or LF row endings. The first row is returned like any other. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ',') {
      pushField();
      i += 1;
      continue;
    }
    if (char === '\r') {
      if (source[i + 1] === '\n') i += 1;
      pushRow();
      i += 1;
      continue;
    }
    if (char === '\n') {
      pushRow();
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }
  if (field !== '' || row.length > 0) pushRow();
  return rows;
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
