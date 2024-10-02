import { useState, useCallback } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Radio, Layout, Typography, Card } from "antd";

import {Subscription} from './Subscription'

export default function PaypalProduct({ options = Array.prototype, description,
  defaultAmount,
  children,
  flexiblePayment,
  subscriptions = []
}) {
  const [amount, setAmount] = useState(defaultAmount);
  const [status, setStatus] = useState();

  const handleSelect = useCallback(e => setAmount(e?.target?.value), [])
  const createOrder = useCallback((data, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          description,
          amount: {
            currency_code: "USD",
            value: amount ?? defaultAmount
          }
        }
      ]
    })
  }, [amount, defaultAmount, description])

  const handleApprove = useCallback(async (data, actions) => {
    await actions.order.capture();A
    setStatus('SUCCESS');
  }, [])

  const handleError = useCallback(err => console.warn(err), []);

  return <Layout.Content>
    {children}
    {
      status === 'SUCCESS' ?
        <Typography>Thank you. Your order has been received.</Typography>
        :
        <>
          <Radio.Group size="large" onChange={handleSelect} value={amount}>
            {options.map(({ name, value }) => (
              <Radio key={name} value={value}>
                {name}
              </Radio>
            ))}
          </Radio.Group>
          {flexiblePayment && <Card title="Flexible Payment" className="big store-card">
            <Typography>If you've arranged to pay a different amount, enter it below before clicking "Buy Now".</Typography>
            <input type="number" value={amount} onChange={({ target }) => setAmount(target.value)}></input>
          </Card>}
          <PayPalButtons forceReRender={[amount, defaultAmount]} createOrder={createOrder} onApprove={handleApprove} onError={handleError} style={{
            shape: "pill",
            color: "blue",
            layout: "vertical",
            label: "buynow"
          }} />
        </>
    }
    {subscriptions.length > 0 && <>
      <h2>Monthly Payment Options</h2>
      Subscriptions allow you to get all your rugby needs for 1 monthly price. Automatic ordering for any team gear. And most importantly, never being hounded to pay your dues again.
      {subscriptions.map(s => <Subscription key={s.id} {...s}/>)}
    </>}
  </Layout.Content>
};
