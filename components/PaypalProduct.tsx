import React, { useState, useCallback } from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { Radio, Layout, Typography, Card, List } from 'antd';
import { Subscription } from './Subscription';

interface Option {
  name: string;
  value: number;
}

interface SubscriptionItem {
  name: string;
  id: string;
  description: string;
  options: Array<{ label: string; value: string }>;
  value?: string;
}

interface PaypalProductProps {
  options?: Option[];
  description: string;
  defaultAmount: number;
  children: React.ReactNode;
  flexiblePayment?: boolean;
  subscriptions?: SubscriptionItem[];
  donation?: boolean;
  supporters?: any[];
}

export default function PaypalProduct({
  options = [],
  description,
  defaultAmount,
  children,
  flexiblePayment,
  subscriptions = [],
  donation = false,
  supporters,
}: PaypalProductProps): JSX.Element {
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [status, setStatus] = useState<string | undefined>();

  const handleSelect = useCallback((e: any) => setAmount(e?.target?.value), []);
  const createOrder = useCallback(
    (data: any, actions: any) => {
      return actions.order.create({
        purchase_units: [
          {
            description,
            amount: {
              currency_code: 'USD',
              value: amount ?? defaultAmount,
            },
          },
        ],
      });
    },
    [amount, defaultAmount, description]
  );

  const handleApprove = useCallback(async (data: any, actions: any) => {
    await actions.order.capture();
    setStatus('SUCCESS');
  }, []);

  const handleError = useCallback((err: any) => console.warn(err), []);

  return (
    <Layout.Content>
      {children}
      {options.length > 0 && (
        status === 'SUCCESS' ? (
          <Typography>Thank you. Your order has been received.</Typography>
        ) : (
          <>
            <Radio.Group size="large" onChange={handleSelect} value={amount}>
              {options.map(({ name, value }) => (
                <Radio key={name} value={value}>
                  {name}
                </Radio>
              ))}
            </Radio.Group>
            {flexiblePayment && (
              <Card
                title={donation ? 'Flexible Amount' : 'Flexible Payment'}
                className="big store-card"
              >
                <Typography>
                  If you've arranged to pay a different amount, enter it below before clicking{' '}
                  {donation ? 'Donate' : 'Buy Now'}.
                </Typography>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                />
              </Card>
            )}
            <PayPalButtons
              forceReRender={[amount, defaultAmount]}
              createOrder={createOrder}
              fundingSource={donation ? 'paypal' : undefined}
              onApprove={handleApprove}
              onError={handleError}
              style={{
                shape: 'pill',
                color: 'blue',
                layout: 'vertical',
                label: donation ? 'donate' : 'buynow',
              }}
            />
            {supporters && (
              <>
                <Typography>Thank you to all our supporters who have made a donation.</Typography>
                <List style={{ height: 400, overflowY: 'scroll' }} bordered>
                  {supporters.map((s: any) => (
                    <List.Item key={s.id || s}>{s}</List.Item>
                  ))}
                </List>
              </>
            )}
          </>
        )
      )}
      {subscriptions.length > 0 && (
        <>
          {subscriptions.map((s) => (
            <Subscription key={s.id} {...s} />
          ))}
        </>
      )}
    </Layout.Content>
  );
}