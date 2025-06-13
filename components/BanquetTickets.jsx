import { PayPalButtons } from '@paypal/react-paypal-js'
import { Form, InputNumber, Layout, Typography } from 'antd'
import { useCallback, useState } from 'react'

const STYLE = {
  shape: "pill",
  color: "blue",
  layout: "vertical",
  label: "buynow"
}

export const TICKET = 50

export default function BanquetTickets({ children }) {
  const [adult, setAdults] = useState(1)
  // const [child, setChild] = useState(0)
  const amount = adult * TICKET;// + Math.min(child, 2) * 10
  const description = `Banquet Tickets (${adult} adult${adult > 1 ? 's' : ''})`

  const [status, setStatus] = useState();

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
  }, [amount, description])

  const handleApprove = useCallback(async (data, actions) => {
    await actions.order.capture();
    setStatus('SUCCESS');
  }, [])

  const handleError = useCallback(err => console.warn(err), []);

  return <Layout.Content>
    {children}
    <Form labelCol={{
      span: 4,
    }}
      wrapperCol={{
        span: 10,
      }}>
      <Form.Item label="Adults">
        <InputNumber addonBefore="Adults" min={1} type="number" value={adult} onChange={setAdults} />
      </Form.Item>
      {/* <Form.Item label="Children" extra="You'll only be charged for the first two. Please enter total number for a head count." >
        <InputNumber type="number" value={child}
          onChange={setChild}
        />
      </Form.Item> */}
      <h3>Total: ${amount}</h3>
    </Form>
    {
      status === 'SUCCESS' ?
        <Typography>Thank you. Your order has been received.</Typography>
        :
        <>
          <PayPalButtons forceReRender={[amount]} createOrder={createOrder} onApprove={handleApprove} onError={handleError} style={STYLE} />
        </>
    }
  </Layout.Content>
}
