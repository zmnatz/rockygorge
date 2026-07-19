import { useState } from "react";
import {
  PayPalOneTimePaymentButton,
  type OnApproveDataOneTimePayments,
} from "@paypal/react-paypal-js/sdk-v6";
import Box from "@mui/material/Box";
import { useRouter } from "next/navigation";

import { FlexiblePaymentForm, PaymentOptions, SupporterCard, Subscription, CardFieldsForm, AppleGooglePay } from "./components";
import { PaypalProvider } from "./utils";
import { PaypalProductProps } from "./types";

export function PaypalProduct({
  options = [],
  description,
  defaultAmount,
  children,
  flexiblePayment,
  subscriptions = [],
  donation = false,
  supporters,
}: PaypalProductProps) {
  const [editAmount, setEditAmount] = useState<number>();
  const amount = editAmount ?? defaultAmount;
  const router = useRouter();

  const handleSelect = (e: any) => setEditAmount(e?.target?.value);

  const createOrder = async () => {
    const response = await fetch("/.netlify/functions/paypal-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", description, amount: amount.toString() }),
    });
    const { orderId } = await response.json();
    return { orderId };
  };

  const handleApprove = async ({ orderId }: OnApproveDataOneTimePayments) => {
    await fetch("/.netlify/functions/paypal-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "capture", orderId }),
    });
    router.push("/purchase/success");
  };

  const handleError = () => router.push("/purchase/error");

  return (
    <Box>
      {children}
      {options.length > 0 && (
        <>
          <PaymentOptions description={description} value={amount} onChange={handleSelect} options={options} />
          {flexiblePayment && (
            <FlexiblePaymentForm donation={donation} value={amount} onChange={setEditAmount} />
          )}
          <PaypalProvider>
            <PayPalOneTimePaymentButton
              key={amount}
              createOrder={createOrder}
              onApprove={handleApprove}
              onError={handleError}
              type={donation ? "donate" : "buynow"}
            />
            <CardFieldsForm
              createOrder={createOrder}
              onApprove={handleApprove}
              onError={handleError}
            />
            <AppleGooglePay
              createOrder={createOrder}
              onApprove={handleApprove}
              onError={handleError}
              amount={amount?.toString() || "0"}
            />
          </PaypalProvider>
        </>
      )}
      {subscriptions.length > 0 &&
        subscriptions.map((s) => <Subscription key={s.id} {...s} />)}
      {supporters && <SupporterCard supporters={supporters} />}
    </Box>
  );
}
