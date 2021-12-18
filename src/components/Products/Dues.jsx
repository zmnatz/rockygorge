import { Typography } from "antd";
import PaypalProduct from "../PaypalProduct";

export const DUES = 175;
export const NEW_PLAYER_DISCOUNT = 25

export const OPTIONS = [
  {name: 'Player Dues', value: DUES},
  {name: 'New Player Dues', value: DUES - NEW_PLAYER_DISCOUNT},
  {name: 'Old Boy Dues', value: 50 }
]

export default function Dues() {
  return <PaypalProduct defaultAmount={DUES} options={OPTIONS} description="Rocky Gorge Dues">
    <Typography.Title level={3}>Pay your dues. Play rugby.</Typography.Title>    
  </PaypalProduct>
}
