import { Typography } from "antd";
import PaypalProduct from "../components/PaypalProduct";
import items from "../data/store.yml";
import Markdown from "react-markdown";
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
}) {
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
      <Typography.Title level={3}>{title}</Typography.Title>
      {details && <Markdown>{details}</Markdown>}
    </PaypalProduct>
  );
}
