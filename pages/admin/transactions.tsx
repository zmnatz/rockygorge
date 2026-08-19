import { RequireAuth } from '@/components/RequireAuth';
import { TransactionsReport } from '@/components/admin/TransactionsReport';

export default function AdminTransactionsPage() {
  return (
    <RequireAuth>
      <TransactionsReport
        title="Transactions"
        subtitle="PayPal transactions report for the selected date range."
      />
    </RequireAuth>
  );
}
