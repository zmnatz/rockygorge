/**
 * PayPal Transaction domain types, shared between the admin-transactions
 * Netlify function (server-side flattening) and the /admin/transactions page.
 */

/** The derived Transaction Type per the domain model. */
export type PaypalTransactionType = 'Payment' | 'Refund' | 'Withdrawal';

/** A flat Transaction row returned by the admin-transactions proxy function.
 *  Money fields are numbers (USD) so consumers can sum and sort without
 *  parsing strings; format with `toFixed(2)` at the display edge. */
export interface PaypalTransaction {
  date: string;
  name: string;
  email: string;
  type: PaypalTransactionType;
  status: string;
  itemTitle: string;
  gross: number;
  fee: number;
  net: number;
  txnId: string;
}

/** The subset of the PayPal Transaction Search API payload the proxy reads. */
export interface PaypalRawTransaction {
  transaction_info?: {
    transaction_id?: string;
    paypal_reference_id?: string;
    transaction_initiation_date?: string;
    transaction_status?: string;
    transaction_subject?: string;
    transaction_note?: string;
    transaction_amount?: { currency_code?: string; value?: string };
    fee_amount?: { currency_code?: string; value?: string };
  };
  payer_info?: {
    email_address?: string;
    payer_name?: { alternate_full_name?: string };
  };
  cart_info?: {
    item_details?: Array<{ item_name?: string; item_options?: string }>;
  };
}
