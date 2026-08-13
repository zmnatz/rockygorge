import { RequireAuth } from '@/components/RequireAuth';
import { TransactionsReport } from '@/components/admin/TransactionsReport';
import store from '@content/store.yml';
import type { StoreItem } from '@/utils/item-match';

interface AdminItemTransactionsProps {
  item: StoreItem;
}

export default function AdminItemTransactionsPage({ item }: AdminItemTransactionsProps) {
  return (
    <RequireAuth>
      <TransactionsReport
        title={`${item.title} — Transactions`}
        subtitle={`Item Matches for ${item.slug} in the selected date range.`}
        item={item}
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
