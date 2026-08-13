/** Pure mapping helpers for the PayPal Transaction Search API.
 *
 * Kept free of network and environment access so the transaction mapping
 * logic can be unit-tested without hitting PayPal.
 */

import type {
  PaypalRawTransaction,
  PaypalTransaction,
  PaypalTransactionType,
} from '../../src/types/paypal';

export const MAX_WINDOW_DAYS = 31;
export const MAX_RANGE_DAYS = 366;
export const PAGE_SIZE = 500;
export const REPORTING_SCOPE = 'https://uri.paypal.com/services/reporting/search/read';

export interface DateWindow {
  start: string;
  end: string;
}

export type RangeValidation =
  | { ok: true; start: string; end: string }
  | { ok: false; error: string };

export function parseMoney(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function deriveType(amount: number, hasReference: boolean): PaypalTransactionType {
  if (amount < 0 && hasReference) return 'Refund';
  if (amount < 0) return 'Withdrawal';
  return 'Payment';
}

export function flattenTransaction(txn: PaypalRawTransaction): PaypalTransaction {
  const info = txn.transaction_info ?? {};
  const payer = txn.payer_info ?? {};
  const cart = txn.cart_info ?? {};

  const gross = parseMoney(info.transaction_amount?.value);
  const fee = parseMoney(info.fee_amount?.value);
  const net = gross + fee;

  const itemTitle =
    (cart.item_details ?? [])
      .map((item) => item.item_name ?? '')
      .filter(Boolean)
      .join('; ') ||
    info.transaction_subject ||
    info.transaction_note ||
    '';

  return {
    date: (info.transaction_initiation_date ?? '').split('T')[0],
    name: payer.payer_name?.alternate_full_name ?? '',
    email: payer.email_address ?? '',
    type: deriveType(gross, Boolean(info.paypal_reference_id)),
    status: info.transaction_status ?? '',
    itemTitle,
    gross: gross.toFixed(2),
    fee: fee.toFixed(2),
    net: net.toFixed(2),
    txnId: info.transaction_id ?? '',
  };
}

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIso(date: Date): string {
  return date.toISOString().replace('.000Z', 'Z');
}

export function buildDateWindows(start: string, end: string): DateWindow[] {
  const startDate = parseDate(start);
  const endExclusive = new Date(parseDate(end).getTime() + 24 * 60 * 60 * 1000);
  const windows: DateWindow[] = [];
  let cursor = startDate;

  while (cursor < endExclusive) {
    const windowEnd = new Date(
      Math.min(
        cursor.getTime() + MAX_WINDOW_DAYS * 24 * 60 * 60 * 1000,
        endExclusive.getTime(),
      ),
    );
    windows.push({ start: toIso(cursor), end: toIso(windowEnd) });
    cursor = windowEnd;
  }

  return windows;
}

export function validateRange(start: string | null | undefined, end: string | null | undefined): RangeValidation {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!start || !end) {
    return { ok: false, error: 'start and end query parameters (YYYY-MM-DD) are required.' };
  }
  if (!datePattern.test(start) || !datePattern.test(end)) {
    return { ok: false, error: 'start and end must be YYYY-MM-DD dates.' };
  }
  if (start > end) {
    return { ok: false, error: 'start must not be after end.' };
  }

  const startDate = parseDate(start);
  const endExclusive = new Date(parseDate(end).getTime() + 24 * 60 * 60 * 1000);
  const days = (endExclusive.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
  if (days > MAX_RANGE_DAYS) {
    return { ok: false, error: `Date range may not exceed ${MAX_RANGE_DAYS} days.` };
  }

  return { ok: true, start, end };
}
