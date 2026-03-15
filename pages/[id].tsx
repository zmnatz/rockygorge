import { Typography } from "@mui/material";
import PaypalProduct from "@/components/PaypalProduct";
import items from "@/data/store.yml";
import { Product } from "@/types/data";
export async function getStaticPaths() {
  return {
    paths: items.map((item) => ({
      params: { id: item.name },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  return { props: items.find((item) => item?.name === params?.id) };
}

export default function StoreItem({
  defaultAmount,
  description,
  options,
  title,
  details,
  donation,
  subscriptions,
  supporters
}: Product) {
  return (
    <PaypalProduct
      defaultAmount={defaultAmount}
      options={options}
      description={description}
      subscriptions={subscriptions}
      donation={donation}
      supporters={supporters}
      flexiblePayment
    >
      <Typography variant="h3">{title}</Typography>
      {details && <p>{details}</p>}
    </PaypalProduct>
  );
}
