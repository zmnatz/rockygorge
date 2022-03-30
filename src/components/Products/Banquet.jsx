import { Typography } from "antd";
import PaypalProduct from "../PaypalProduct";

export const TICKET = 65;

export const OPTIONS = [
  { name: `2 Tickets - $${TICKET * 2}`, value: TICKET * 2 },
  {
    name: `1 Ticket - $${TICKET}`,
    value: TICKET
  }
];

export default function Banquet() {
  return (
    <PaypalProduct
      defaultAmount={TICKET * 2}
      options={OPTIONS}
      description="Banquet Tickets"
    >
      <Typography.Title level={3}>
        Join us in celebrating the 10th anniversary of our club's first National
        Championship.
      </Typography.Title>
    </PaypalProduct>
  );
}
