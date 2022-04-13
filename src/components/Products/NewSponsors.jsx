import { Typography } from "antd";
import PaypalProduct from "../PaypalProduct";

export const TICKET = 65;

export const OPTIONS = [
  { name: `Full Front - $1000`, value: 1000 },
  { name: `Arm Patch - $250`, value: 250 },
  { name: `Back Logo - $500`, value: 500 },
  { name: `Shorts - $300`, value: 300 }
];

export default function Banquet() {
  return (
    <PaypalProduct
      defaultAmount={TICKET * 2}
      options={OPTIONS}
      description="Sponsorship"
    >
      <Typography>
        Rocky Gorge is looking for sponsors for our 2022/2023 season. Please
        send logos to{" "}
        <a href="mailto:sponsor@rockygorgerugby.com">
          sponsor@rockygorgerugby.com
        </a>
        . For full sponsorship details, read our{" "}
        <a target="_blank" href="/media/Rocky-Gorge-Sponsorship.pdf">
          brochure
        </a>
        .
      </Typography>
    </PaypalProduct>
  );
}
