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
      <Typography.Title level={2}>
        Join us in celebrating the 10th anniversary of our club's first National
        Championship.
      </Typography.Title>
      <Typography.Title level={4}>When: June 4, 7pm - 11pm</Typography.Title>
      <Typography.Title level={4}>
        Where: The Meeting House, 5885 Robert Oliver Place, Columbia MD
      </Typography.Title>

      <Typography>
        Enjoy food, drinks and entertainment with master of ceremony, our very
        own comedian Erik Woodworth. The agenda includes awards for the 2022
        season, honoring our Rocky Gorge Hall of Fame and a tribute video to the
        championship produced by Evan Lappen.
      </Typography>
    </PaypalProduct>
  );
}
