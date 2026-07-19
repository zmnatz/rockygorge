import { ReactNode } from "react";
import { PayPalProvider as PayPalProviderV6 } from "@paypal/react-paypal-js/sdk-v6";

export function PaypalProvider({ children }: { children: ReactNode }) {
  return (
    <PayPalProviderV6
      clientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}
      environment={(process.env.NEXT_PUBLIC_PAYPAL_ENV as "sandbox" | "production") || "production"}
      components={["paypal-payments"]}
      pageType="checkout"
    >
      {children}
    </PayPalProviderV6>
  );
}
