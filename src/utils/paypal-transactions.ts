/** Pure mapping helpers for the PayPal Transaction Search API.
 *
 * Kept free of network and environment access so the transaction mapping
 * logic can be unit-tested without hitting PayPal.
 */

import type { DateRange } from '../types/date-range';
import type {
  PaypalRawTransaction,
  PaypalTransaction,
  PaypalTransactionType,
} from '../types/paypal';
import { DAY_MS, MAX_RANGE_DAYS, countDays, isValidDate, parseDate } from './date-range';

export const MAX_WINDOW_DAYS = 31;
export const PAGE_SIZE = 500;
export const REPORTING_SCOPE = 'https://uri.paypal.com/services/reporting/search/read';

export type RangeValidation =
  | ({ ok: true } & DateRange)
  | { ok: false; error: string };

export type RangeQuery = {
  start?: string | null;
  end?: string | null;
};

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

  // Subscription billing payments carry their tier as `item_options` (e.g.
  // "DUES: GODs") rather than a description, so options join the item title
  // alongside any item name to keep the chosen plan attributable.
  const itemTitle =
    (cart.item_details ?? [])
      .flatMap((item) => [item.item_name ?? '', item.item_options ?? ''])
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
    gross,
    fee,
    net,
    txnId: info.transaction_id ?? '',
  };
}

/** Format a Date as a UTC timestamp without milliseconds, the shape the PayPal
 *  Transaction Search API expects for `start_date`/`end_date`. */
function toPaypalTimestamp(date: Date): string {
  return date.toISOString().replace('.000Z', 'Z');
}

export function buildDateWindows(range: DateRange): DateRange[] {
  const startDate = parseDate(range.start);
  const endExclusive = new Date(parseDate(range.end).getTime() + DAY_MS);
  const windows: DateRange[] = [];
  let cursor = startDate;

  while (cursor < endExclusive) {
    const windowEnd = new Date(
      Math.min(
        cursor.getTime() + MAX_WINDOW_DAYS * DAY_MS,
        endExclusive.getTime(),
      ),
    );
    windows.push({ start: toPaypalTimestamp(cursor), end: toPaypalTimestamp(windowEnd) });
    cursor = windowEnd;
  }

  return windows;
}

export function validateRange(range: RangeQuery): RangeValidation {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!range.start || !range.end) {
    return { ok: false, error: 'start and end query parameters (YYYY-MM-DD) are required.' };
  }
  if (!datePattern.test(range.start) || !datePattern.test(range.end)) {
    return { ok: false, error: 'start and end must be YYYY-MM-DD dates.' };
  }
  if (!isValidDate(range.start) || !isValidDate(range.end)) {
    return { ok: false, error: 'start and end must be valid calendar dates.' };
  }
  if (range.start > range.end) {
    return { ok: false, error: 'start must not be after end.' };
  }

  if (countDays({ start: range.start, end: range.end }) > MAX_RANGE_DAYS) {
    return { ok: false, error: `Date range may not exceed ${MAX_RANGE_DAYS} days.` };
  }

  return { ok: true, start: range.start, end: range.end };
}
