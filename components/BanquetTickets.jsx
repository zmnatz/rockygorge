import { Form, InputNumber } from 'antd'
import PaypalProduct from './PaypalProduct'
import { useState } from 'react'
export default function BanquetTickets({ children }) {
  const [adult, setAdults] = useState(2)
  const [child, setChild] = useState(0)
  const amount = adult * 30 + Math.min(child, 2) * 10
  return <PaypalProduct defaultAmount={amount} description={`Banquet Tickets (${adult} adult, ${child} children)`}>
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
      <Form.Item label="Children" extra="You'll only be charged for the first two. Please enter total number for a head count." >
        <InputNumber type="number" value={child} 
          onChange={setChild}
        />
      </Form.Item>
      <h3>Total: ${amount}</h3>
    </Form>
  </PaypalProduct>
}