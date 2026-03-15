import React, { useState, useCallback } from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
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
    <Box>
      {children}
      {options.length > 0 && (
        status === 'SUCCESS' ? (
          <Typography>Thank you. Your order has been received.</Typography>
        ) : (
          <>
            <FormControl>
              <FormLabel>{description}</FormLabel>
              <RadioGroup value={amount} onChange={handleSelect}>
                {options.map(({ name, value }) => (
                  <FormControlLabel
                    key={name}
                    value={value}
                    control={<Radio />}
                    label={name}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            {flexiblePayment && (
              <Card className="big store-card">
                <CardHeader title={donation ? 'Flexible Amount' : 'Flexible Payment'} />
                <CardContent>
                  <Typography>
                    If you've arranged to pay a different amount, enter it below before clicking{' '}
                    {donation ? 'Donate' : 'Buy Now'}.
                  </Typography>
                  <TextField
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
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
      {supporters && (
        <Card sx={{ mt: 4 }} >
          <CardHeader title="Thanks to all our supporters!" />
          <CardContent>
          <List sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {supporters.map((s: any) => (
              <ListItem key={s.id || s}>{s}</ListItem>
            ))}
          </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}