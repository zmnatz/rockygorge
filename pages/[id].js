import { Typography } from "antd";
import PaypalProduct from "../components/PaypalProduct";
import items from "../data/store.yml";
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
}) {
  return (
    <PaypalProduct
      defaultAmount={defaultAmount}
      options={options}
      description={description}
      flexiblePayment
    >
      <Typography.Title level={3}>{title}</Typography.Title>
      {details && <p>{details}</p>}
    </PaypalProduct>
  );
}
