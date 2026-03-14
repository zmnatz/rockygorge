import React, { useCallback, useState } from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { Form, InputNumber, Layout, Typography } from 'antd';

const STYLE = {
  shape: "pill" as const,
  color: "blue" as const,
  layout: "vertical" as const,
  label: "buynow" as const,
};

export const TICKET = 50;

interface BanquetTicketsProps {
  children?: React.ReactNode;
}

export default function BanquetTickets({ children }: BanquetTicketsProps) {
  const [adult, setAdults] = useState<number>(1);
  // const [child, setChild] = useState(0)
  const amount = adult * TICKET; // + Math.min(child, 2) * 10
  const description = `Banquet Tickets (${adult} adult${adult > 1 ? 's' : ''})`;

  const [status, setStatus] = useState<string | undefined>();

  const createOrder = useCallback((data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          description,
          amount: {
            currency_code: "USD",
            value: amount,
          },
        },
      ],
    });
  }, [amount, description]);

  const handleApprove = useCallback(async (data: any, actions: any) => {
    await actions.order.capture();
    setStatus('SUCCESS');
  }, []);

  const handleError = useCallback((err: any) => console.warn(err), []);

  return (
    <Layout.Content>
      {children}
      <Form
        labelCol={{
          span: 4,
        }}
        wrapperCol={{
          span: 10,
        }}
      >
        <Form.Item label="Adults">
          <InputNumber
            min={1}
            type="number"
            value={adult}
            onChange={(value) => setAdults(value as number)}
          />
        </Form.Item>
        {/* <Form.Item label="Children" extra="You'll only be charged for the first two. Please enter total number for a head count." >
        <InputNumber type="number" value={child}
          onChange={setChild}
        />
      </Form.Item> */}
        <h3>Total: ${amount}</h3>
      </Form>
      {status === 'SUCCESS' ? (
        <Typography>Thank you. Your order has been received.</Typography>
      ) : (
        <>
          <PayPalButtons
            forceReRender={[amount]}
            createOrder={createOrder}
            onApprove={handleApprove}
            onError={handleError}
            style={STYLE}
          />
        </>
      )}
    </Layout.Content>
  );
}