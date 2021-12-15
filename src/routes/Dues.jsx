import { useState, useCallback } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Radio, Layout, Typography } from "antd";

const CURRENT_DUES = 175
const NEW_DISCOUNT = 25
const OLD_BOYS = 50

export default function Dues() {
  const [amount, setAmount] = useState(CURRENT_DUES);
  const [status, setStatus] = useState();

  const handleSelect = useCallback(e => setAmount(e?.target?.value), [])

  const createOrder = useCallback((data, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          description: 'Rocky Gorge Dues',
          amount: {
            currency_code: "USD",
            value: amount
          }
        }
      ]
    })
  }, [amount])

  const handleApprove = useCallback(async (data, actions) => {
    await actions.order.capture();
    setStatus('SUCCESS');
  }, [])

  const handleError = useCallback(err => console.warn(err), []);

  return <Layout.Content>
    <Typography.Title level={3}>Pay your dues. Play rugby.</Typography.Title>
    {
      status === 'SUCCESS' ?
        <Typography>Thank you for paying your dues.</Typography>
        :
        <>
          <Radio.Group size="large" onChange={handleSelect} value={amount}>
            <Radio value={CURRENT_DUES}>
              Player Dues - ${CURRENT_DUES}
            </Radio>
            <Radio value={CURRENT_DUES - NEW_DISCOUNT}>
              New Player Dues - ${CURRENT_DUES - NEW_DISCOUNT}
            </Radio>
            <Radio value={OLD_BOYS}>
              Old Boy Dues - ${OLD_BOYS}
            </Radio>
          </Radio.Group>
          <PayPalButtons forceReRender={[amount]} createOrder={createOrder} onApprove={handleApprove} onError={handleError} style={{
            shape: "pill",
            color: "blue",
            layout: "vertical",
            label: "buynow"
          }} />
        </>
    }
  </Layout.Content>
};
