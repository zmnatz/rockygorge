import { RequireAuth } from '@/components/RequireAuth';
import { TransactionsReport } from '@/components/admin/TransactionsReport';
import store from '@content/store.yml';
import type { StoreItem } from '@/types/data';

export default function AdminTransactionsPage() {
  return (
    <RequireAuth>
      <TransactionsReport
        title="Transactions"
        subtitle="PayPal transactions report for the selected date range."
        storeItems={store as StoreItem[]}
      />
    </RequireAuth>
  );
}
