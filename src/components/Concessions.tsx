import React, { useState } from 'react';
import PaypalProduct from './PaypalProduct';
import TextField from '@mui/material/TextField';

export default function Concessions(): JSX.Element {
  const [amount, setAmount] = useState<number>(5);
  return (
    <PaypalProduct defaultAmount={5} description="Concessions">
      <form>
        <label>Concession Charge</label>
        <TextField
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          InputProps={{ inputProps: { min: 0 } }}
          size="small"
          sx={{ ml: 1 }}
        />
      </form>
    </PaypalProduct>
  );
}