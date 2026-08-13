import { RequireAuth } from '@/components/RequireAuth';
import { TransactionsReport } from '@/components/admin/TransactionsReport';
import store from '@content/store.yml';
import type { Product } from '@/types/data';

interface AdminItemTransactionsProps {
  item: Product;
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
    paths: store.map((item) => ({
      params: { slug: item.slug },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params?: { slug: string } }) {
  const item = store.find((entry) => entry.slug === params?.slug);
  if (!item) return { notFound: true };

  return {
    props: { item },
  };
}
