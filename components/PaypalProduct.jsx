import { useState, useCallback } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Radio, Descriptions, Input } from "antd";

import { useRouter } from "next/navigation";

export default function PaypalProduct({product}) {
  const { 
    options = [], 
    description,
    defaultAmount,
    donation = false,
  } = product
  
  const [amount, setAmount] = useState(defaultAmount);
  const router = useRouter();

  const handleSelect = useCallback(e => setAmount(e?.target?.value), [])
  const createOrder = useCallback((_data, actions) => {
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

  const handleApprove = useCallback(async (_data, actions) => {
    await actions.order.capture();
    router.push('/order/complete')
  }, [])

  const handleError = useCallback(_err => router.push('/order/error'), []);

  if (options.length < 1 && !donation) {
    return null;
  }

  return <>
    <Radio.Group size="large" onChange={handleSelect} value={amount}>
      {options.map(({ name, value }) => (
        <Radio key={name} value={value}>
          {name}
        </Radio>
      ))}
    </Radio.Group>
    {<Descriptions title="Flexible Payments" layout="vertical" size="middle"
      colon={false}
      style={{ maxWidth: 600 }}
      items={[
        {
          key: '1',
          label: `If you've arranged to pay a different amount, enter it below before submitting payment.`,
          children: <Input type="number" value={amount} onChange={({ target }) => setAmount(target.value)} />,
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
  </>
};
