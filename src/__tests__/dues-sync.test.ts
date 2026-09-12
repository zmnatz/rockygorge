import { describe, it, expect } from 'vitest';
import type { Dues } from '@/types/data';
import {
  mergeLedgerRows,
  renderDuesBlock,
  splitLedgerBlocks,
} from '../../netlify/functions/admin-dues-sync';

const SAMPLE = [
  '- name: Jamel Murray',
  '  date: 2026-09-11',
  '- name: Adam Wiley',
  '  monthly: true',
  '  date: 2026-09-05',
  '- name: Gregory Teliczan',
  '  date: 2026-07-14',
  '',
].join('\n');

describe('renderDuesBlock', () => {
  it('emits ledger-style rows with only the flags present', () => {
    expect(renderDuesBlock({ name: 'Chuck Moore', date: '2026-08-28', supporter: true })).toBe(
      '- name: Chuck Moore\n  supporter: true\n  date: 2026-08-28',
    );
    expect(renderDuesBlock({ name: 'Mason McIlwee', date: '2026-09-11', monthly: true })).toBe(
      '- name: Mason McIlwee\n  monthly: true\n  date: 2026-09-11',
    );
  });
});

describe('splitLedgerBlocks', () => {
  it('splits the file into name/date blocks', () => {
    const blocks = splitLedgerBlocks(SAMPLE);
    expect(blocks.map((block) => block.name)).toEqual([
      'Jamel Murray',
      'Adam Wiley',
      'Gregory Teliczan',
    ]);
    expect(blocks.map((block) => block.date)).toEqual([
      '2026-09-11',
      '2026-09-05',
      '2026-07-14',
    ]);
  });
});

describe('mergeLedgerRows', () => {
  it('skips names already on the ledger and slots the rest into date-desc order', () => {
    const candidates: Dues[] = [
      { name: 'Grace Hopper', date: '2026-08-20', monthly: true },
      { name: 'Jamel Murray', date: '2026-09-30' },
      { name: 'Amy Lee', date: '2026-09-11' },
      { name: 'Ada Lovelace', date: '2026-07-01' },
    ];

    const { added, skipped, updated } = mergeLedgerRows(SAMPLE, candidates);

    expect(skipped).toEqual(['Jamel Murray']);
    expect(added.map((block) => block.name)).toEqual([
      'Amy Lee',
      'Grace Hopper',
      'Ada Lovelace',
    ]);
    expect(updated.map((block) => block.name)).toEqual([
      'Amy Lee',
      'Jamel Murray',
      'Adam Wiley',
      'Grace Hopper',
      'Gregory Teliczan',
      'Ada Lovelace',
    ]);
    expect(updated).toHaveLength(6);

    const inserted = updated.filter((block) =>
      added.some((entry) => entry.name === block.name),
    );
    expect(inserted.map((block) => block.text)).toContain(
      '- name: Grace Hopper\n  monthly: true\n  date: 2026-08-20',
    );
  });
});