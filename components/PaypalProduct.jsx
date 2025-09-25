import { useState, useCallback } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Radio, Typography, List, Descriptions, Input } from "antd";

import {Subscription} from './Subscription'

export default function PaypalProduct({ options = Array.prototype, description,
  defaultAmount,
  children,
  flexiblePayment,
  subscriptions = [],
  donation = false,
  supporters
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

  return <>
    {children}
    {options.length > 0 && (
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
          {flexiblePayment && <Descriptions title="Flexible Payments" layout="vertical" size="middle"
            colon={false}
            style={{maxWidth: 600}}
            items={[
              {
                key: '1',
                label: `If you've arranged to pay a different amount, enter it below before submitting payment.`,
                children: <Input type="number" value={amount} onChange={({ target }) => setAmount(target.value)}/>,
              },
            ]} 
          />}
          <PayPalButtons forceReRender={[amount, defaultAmount]} 
            createOrder={createOrder} 
            fundingSource={donation ? "paypal" : undefined}

            onApprove={handleApprove} onError={handleError} style={{
            shape: "pill",
            color: "blue",
            layout: "vertical",
            label: donation ? "donate" : "buynow"
          }} />
          {supporters && <>
            <Typography>Thank you to all our supporters who have made a donation.</Typography>
            <List style={{height: 400, overflowY: 'scroll'}} bordered>
              {supporters.map(s => <List.Item key={s.id}>{s}</List.Item>)}
            </List>
          </>}
        </>
    )}
    {subscriptions.length > 0 && <>
      {subscriptions.map(s => <Subscription key={s.id} {...s}/>)}
    </>}
  </>
};
