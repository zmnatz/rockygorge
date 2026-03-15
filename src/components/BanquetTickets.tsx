import React, { useCallback, useState } from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

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
    <Box>
      {children}
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 360 }}>
        <TextField
          label="Adults"
          type="number"
          value={adult}
          onChange={(e) => setAdults(parseInt(e.target.value, 10) || 0)}
          inputProps={{ min: 1 }}
          size="small"
        />
        <Typography variant="h6">Total: ${amount}</Typography>
      </Box>
      {status === 'SUCCESS' ? (
        <Typography>Thank you. Your order has been received.</Typography>
      ) : (
        <PayPalButtons
          forceReRender={[amount]}
          createOrder={createOrder}
          onApprove={handleApprove}
          onError={handleError}
          style={STYLE}
        />
      )}
    </Box>
  );
}