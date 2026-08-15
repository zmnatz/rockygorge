import { RequireAuth } from '@/components/RequireAuth';
import { TransactionsReport } from '@/components/admin/TransactionsReport';
import { DuesDiffPanel } from '@/components/admin/DuesDiffPanel';
import store from '@content/store.yml';
import duesYaml from '@content/admin/dues.yaml';
import type { StoreItem, Dues } from '@/types/data';

interface AdminItemTransactionsProps {
  item: StoreItem;
  dues: Dues[];
  supporters: string[];
}

export default function AdminItemTransactionsPage({
  item,
  dues,
  supporters,
}: AdminItemTransactionsProps) {
  const hasSubscriptions = (item.subscriptions ?? []).length > 0;
  const isDues = item.slug === 'dues';
  return (
    <RequireAuth>
      <TransactionsReport
        title={`${item.title} — Transactions`}
        subtitle={
          hasSubscriptions
            ? `Transactions attributed to "${item.title}" in the selected date range.`
            : `Transactions matching "${item.description}" in the selected date range.`
        }
        item={hasSubscriptions ? item : undefined}
        initialFilter={hasSubscriptions ? undefined : item.description}
        fileStem={`paypal-transactions_${item.slug}`}
        renderPanel={
          isDues
            ? (visible) => (
                <DuesDiffPanel
                  transactions={visible}
                  existingDues={dues}
                  existingSupporters={supporters}
                />
              )
            : undefined
        }
      />
    </RequireAuth>
  );
}

export async function getStaticPaths() {
  return {
    paths: store
      .filter((entry) => entry.slug)
      .map((entry) => ({
        params: { slug: entry.slug },
      })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params?: { slug: string } }) {
  const entry = store.find((item) => item.slug === params?.slug);
  if (!entry) return { notFound: true };
  const supporters = store.find((item) => item.slug === 'supporters')?.supporters ?? [];

  return {
    props: {
      item: {
        slug: entry.slug,
        title: entry.title,
        description: entry.description,
        subscriptions: entry.subscriptions ?? [],
      },
      dues: duesYaml,
      supporters,
    },
  };
}
