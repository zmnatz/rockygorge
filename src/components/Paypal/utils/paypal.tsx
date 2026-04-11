import { ReactNode } from "react";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export const PAYPAL_SETTINGS = {
  "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  currency: "USD",
};

export function PaypalProvider ({children}: {children: ReactNode}) {
  return <PayPalScriptProvider options={PAYPAL_SETTINGS}>
    {children}
  </PayPalScriptProvider>
}