import { List, Typography } from "antd";
import PaypalProduct from "../components/PaypalProduct";
import items from "../data/store.yml";
import Markdown from "react-markdown";
import { Subscription } from "../components/Subscription";

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
    <>
      {(options.length > 0 || donation) && <>
          <Typography.Title level={3}>{title}</Typography.Title>
          {details && <Markdown>{details}</Markdown>}
          <PaypalProduct
            defaultAmount={defaultAmount}
            options={options}
            description={description}
            donation={donation}
            flexiblePayment
          />
        </>
      }
      {subscriptions.length > 0 && <>
        {subscriptions.map(s => <Subscription key={s.id} {...s} />)}
      </>}
      {supporters && supporters.length > 0 && <>
        <Typography>Thank you to all our supporters:</Typography>
        <List style={{ height: 400, overflowY: 'scroll' }} bordered>
          {supporters.map(s => <List.Item key={s.id}>{s}</List.Item>)}
        </List>
      </>}
    </>
  );
}
