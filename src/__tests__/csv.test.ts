import { describe, it, expect } from 'vitest';
import { toCsv } from '@/utils/csv';
import type { CsvColumn } from '@/utils/csv';

type Row = { date: string; name: string; net: string };

const columns: CsvColumn<Row>[] = [
  { key: 'date', title: 'Date' },
  { key: 'name', title: 'Name' },
  { key: 'net', title: 'Net' },
];

describe('toCsv', () => {
  it('writes a header row followed by a data row per record', () => {
    const csv = toCsv(columns, [
      { date: '2026-05-01', name: 'Jane Doe', net: '23.75' },
      { date: '2026-05-02', name: 'John Smith', net: '-25.00' },
    ]);

    expect(csv).toBe(
      'Date,Name,Net\r\n' +
        '2026-05-01,Jane Doe,23.75\r\n' +
        '2026-05-02,John Smith,-25.00',
    );
  });

  it('quotes fields containing commas, quotes, or newlines', () => {
    const csv = toCsv(columns, [
      { date: '2026-05-01', name: 'Doe, Jane', net: '10.00' },
      { date: '2026-05-02', name: 'Quote "Me"', net: '10.00' },
      { date: '2026-05-03', name: 'Line\nBreak', net: '10.00' },
    ]);

    expect(csv).toBe(
      'Date,Name,Net\r\n' +
        '2026-05-01,"Doe, Jane",10.00\r\n' +
        '2026-05-02,"Quote ""Me""",10.00\r\n' +
        '2026-05-03,"Line\nBreak",10.00',
    );
  });

  it('writes an empty body when there are no rows', () => {
    expect(toCsv(columns, [])).toBe('Date,Name,Net');
  });
});
