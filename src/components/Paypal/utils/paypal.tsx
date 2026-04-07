import { ReactNode } from "react";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export const PAYPAL_SETTINGS = {
  "client-id": "ASmTD9KvSepF8Mr7dKvFYJFlbQHBEld1lMSMyHFRouAAuBfx4tY1x9fMBuBP7buCTZa_Jou7xn7iiBbt",
  currency: "USD",
};

export function PaypalProvider ({children}: {children: ReactNode}) {
  return <PayPalScriptProvider options={PAYPAL_SETTINGS}>
    {children}
  </PayPalScriptProvider>
}