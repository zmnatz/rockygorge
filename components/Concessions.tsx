import React, { useState } from 'react';
import PaypalProduct from './PaypalProduct';
import { Input } from 'antd';

export default function Concessions(): JSX.Element {
  const [amount, setAmount] = useState<number>(5);
  return (
    <PaypalProduct defaultAmount={5} description="Concessions">
      <form>
        <label>Concession Charge</label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
        />
      </form>
    </PaypalProduct>
  );
}