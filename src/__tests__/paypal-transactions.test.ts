import { describe, it, expect } from 'vitest';
import {
  buildDateWindows,
  deriveType,
  flattenTransaction,
  parseMoney,
  validateRange,
} from '../../netlify/functions/paypal-transactions';
import type { PaypalRawTransaction } from '@/types/paypal';

function rawTransaction(overrides: Partial<PaypalRawTransaction> = {}): PaypalRawTransaction {
  return {
    transaction_info: {
      transaction_id: 'TXN-1',
      paypal_reference_id: '',
      transaction_initiation_date: '2026-05-01T12:34:56Z',
      transaction_status: 'S',
      transaction_amount: { currency_code: 'USD', value: '25.00' },
      fee_amount: { currency_code: 'USD', value: '-1.25' },
      transaction_subject: 'Banquet ticket',
    },
    payer_info: {
      email_address: 'jane@example.com',
      payer_name: { alternate_full_name: 'Jane Doe' },
    },
    cart_info: { item_details: [{ item_name: 'Banquet Ticket' }] },
    ...overrides,
  };
}

describe('deriveType', () => {
  it('classifies a positive amount as Payment', () => {
    expect(deriveType(25, false)).toBe('Payment');
    expect(deriveType(25, true)).toBe('Payment');
  });

  it('classifies a negative amount with a reference as Refund', () => {
    expect(deriveType(-25, true)).toBe('Refund');
  });

  it('classifies a negative amount without a reference as Withdrawal', () => {
    expect(deriveType(-25, false)).toBe('Withdrawal');
  });

  it('classifies a zero amount as Payment', () => {
    expect(deriveType(0, false)).toBe('Payment');
  });
});

describe('parseMoney', () => {
  it('parses a decimal string', () => {
    expect(parseMoney('12.50')).toBe(12.5);
  });

  it('returns 0 for missing or unparseable values', () => {
    expect(parseMoney(undefined)).toBe(0);
    expect(parseMoney('')).toBe(0);
    expect(parseMoney('abc')).toBe(0);
  });
});

describe('flattenTransaction', () => {
  it('maps a raw payment to a flat row', () => {
    const flat = flattenTransaction(rawTransaction());

    expect(flat).toEqual({
      date: '2026-05-01',
      name: 'Jane Doe',
      email: 'jane@example.com',
      type: 'Payment',
      status: 'S',
      itemTitle: 'Banquet Ticket',
      gross: '25.00',
      fee: '-1.25',
      net: '23.75',
      txnId: 'TXN-1',
    });
  });

  it('computes net as gross plus the (negative) fee', () => {
    const flat = flattenTransaction(
      rawTransaction({
        transaction_info: {
          transaction_id: 'TXN-2',
          transaction_amount: { currency_code: 'USD', value: '50.00' },
          fee_amount: { currency_code: 'USD', value: '-1.50' },
        },
      }),
    );

    expect(flat.gross).toBe('50.00');
    expect(flat.fee).toBe('-1.50');
    expect(flat.net).toBe('48.50');
  });

  it('derives Refund for a negative amount with a reference id', () => {
    const flat = flattenTransaction(
      rawTransaction({
        transaction_info: {
          transaction_id: 'TXN-3',
          paypal_reference_id: 'TXN-1',
          transaction_amount: { currency_code: 'USD', value: '-25.00' },
          fee_amount: { currency_code: 'USD', value: '0.00' },
        },
      }),
    );

    expect(flat.type).toBe('Refund');
    expect(flat.net).toBe('-25.00');
  });

  it('derives Withdrawal for a negative amount without a reference id', () => {
    const flat = flattenTransaction(
      rawTransaction({
        transaction_info: {
          transaction_id: 'TXN-4',
          transaction_amount: { currency_code: 'USD', value: '-100.00' },
          fee_amount: { currency_code: 'USD', value: '-2.00' },
        },
      }),
    );

    expect(flat.type).toBe('Withdrawal');
    expect(flat.net).toBe('-102.00');
  });

  it('joins multiple cart item names into the item title', () => {
    const flat = flattenTransaction(
      rawTransaction({
        cart_info: {
          item_details: [{ item_name: 'Tickets' }, { item_name: 'Donation' }],
        },
      }),
    );

    expect(flat.itemTitle).toBe('Tickets; Donation');
  });

  it('falls back to the subject and note when there are no cart items', () => {
    const flat = flattenTransaction(
      rawTransaction({
        cart_info: { item_details: [] },
        transaction_info: {
          transaction_id: 'TXN-5',
          transaction_subject: 'Open Entry',
          transaction_note: 'A note',
        },
      }),
    );

    expect(flat.itemTitle).toBe('Open Entry');

    const noted = flattenTransaction(
      rawTransaction({
        cart_info: { item_details: [] },
        transaction_info: { transaction_id: 'TXN-6', transaction_note: 'A note' },
      }),
    );
    expect(noted.itemTitle).toBe('A note');
  });

  it('defaults name, email, and date when the raw payload lacks them', () => {
    const flat = flattenTransaction({ transaction_info: {} });

    expect(flat.date).toBe('');
    expect(flat.name).toBe('');
    expect(flat.email).toBe('');
    expect(flat.status).toBe('');
    expect(flat.itemTitle).toBe('');
    expect(flat.txnId).toBe('');
    expect(flat.gross).toBe('0.00');
    expect(flat.net).toBe('0.00');
  });
});

describe('buildDateWindows', () => {
  it('returns a single window for a short range', () => {
    const windows = buildDateWindows('2026-05-01', '2026-05-05');

    expect(windows).toEqual([
      { start: '2026-05-01T00:00:00Z', end: '2026-05-06T00:00:00Z' },
    ]);
  });

  it('splits a range longer than 31 days into 31-day windows', () => {
    const windows = buildDateWindows('2026-01-01', '2026-03-15');

    expect(windows.length).toBe(3);
    expect(windows[0]).toEqual({ start: '2026-01-01T00:00:00Z', end: '2026-02-01T00:00:00Z' });
    expect(windows[1]).toEqual({ start: '2026-02-01T00:00:00Z', end: '2026-03-04T00:00:00Z' });
    expect(windows[2]).toEqual({ start: '2026-03-04T00:00:00Z', end: '2026-03-16T00:00:00Z' });
  });

  it('emits one window covering a single day', () => {
    const windows = buildDateWindows('2026-06-01', '2026-06-01');

    expect(windows).toEqual([{ start: '2026-06-01T00:00:00Z', end: '2026-06-02T00:00:00Z' }]);
  });
});

describe('validateRange', () => {
  it('accepts a valid range', () => {
    expect(validateRange('2026-05-01', '2026-05-31')).toEqual({
      ok: true,
      start: '2026-05-01',
      end: '2026-05-31',
    });
  });

  it('rejects missing start or end', () => {
    expect(validateRange(null, '2026-05-31').ok).toBe(false);
    expect(validateRange('2026-05-01', null).ok).toBe(false);
    expect(validateRange(undefined, undefined).ok).toBe(false);
  });

  it('rejects malformed dates', () => {
    expect(validateRange('05/01/2026', '2026-05-31').ok).toBe(false);
    expect(validateRange('2026-5-1', '2026-05-31').ok).toBe(false);
  });

  it('rejects a start after the end', () => {
    const result = validateRange('2026-05-31', '2026-05-01');
    expect(result.ok).toBe(false);
  });

  it('rejects a range over 366 days', () => {
    expect(validateRange('2024-01-01', '2025-01-01').ok).toBe(false);
  });

  it('accepts a range of exactly 366 days', () => {
    const result = validateRange('2024-01-01', '2024-12-31');
    expect(result.ok).toBe(true);
  });
});
