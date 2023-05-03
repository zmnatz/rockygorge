import { Typography } from "antd";
import PaypalProduct from "../components/PaypalProduct";


export const TICKET = 30;
export const KIDS = 20

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
        Join us in celebrating the 2023 MAC Championship
      </Typography.Title>
      <Typography.Title level={4}>When: June 25, 3pm-6pm</Typography.Title>
      <Typography.Title level={4}>
        Where: TBA
      </Typography.Title>
      <Typography>
        RSVP and sign up for updates on <a href="http://evite.me/vdRm5RTyCm">Evite</a>
      </Typography>
    </PaypalProduct>
  );
}
