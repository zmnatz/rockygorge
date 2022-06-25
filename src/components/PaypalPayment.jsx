import { useState, useCallback } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Radio, Layout, Typography } from "antd";

export default function PaypalProduct({ description, amount, children }) {
  const [status, setStatus] = useState();

  const createOrder = useCallback((data, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          description,
          amount: {
            currency_code: "USD",
            value: amount
          }
        }
      ]
    })
  }, [amount, description])

  const handleApprove = useCallback(async (data, actions) => {
    await actions.order.capture();
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
