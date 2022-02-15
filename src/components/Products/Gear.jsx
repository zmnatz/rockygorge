import { Typography } from "antd";
import PaypalProduct from "../PaypalProduct";

export const OPTIONS = [
  { name: `Shorts - $30`, value: 30 },
  { name: "Shirt - $15", value: 15 }
];

export default function Gear() {
  return (
    <PaypalProduct defaultAmount={25} options={OPTIONS} description="Team Gear">
      <Typography.Title level={3}>Buy team gear</Typography.Title>
    </PaypalProduct>
  );
}
