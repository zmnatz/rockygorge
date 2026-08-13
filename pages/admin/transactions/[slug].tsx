import { RequireAuth } from '@/components/RequireAuth';
import { TransactionsReport } from '@/components/admin/TransactionsReport';
import store from '@content/store.yml';
import type { StoreItem } from '@/types/data';

interface AdminItemTransactionsProps {
  item: StoreItem;
}

export default function AdminItemTransactionsPage({ item }: AdminItemTransactionsProps) {
  return (
    <RequireAuth>
      <TransactionsReport
        title={`${item.title} — Transactions`}
        subtitle={`Transactions matching "${item.description}" in the selected date range.`}
        initialFilter={item.description}
        itemSlug={item.slug}
        fileStem={`paypal-transactions_${item.slug}`}
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

  return {
    props: {
      item: { slug: entry.slug, title: entry.title, description: entry.description },
    },
  };
}
