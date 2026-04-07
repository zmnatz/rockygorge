import { useState } from "react";
import {
  CreateOrderBraintreeActions,
  OnApproveBraintreeActions,
  PayPalButtons,
} from "@paypal/react-paypal-js";
import Box from "@mui/material/Box";
import { useRouter } from "next/navigation";

import { FlexiblePaymentForm, PaymentOptions, SupporterCard, Subscription} from "./components";
import { PaypalProvider } from './utils'
import { PaypalProductProps } from "./types";

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
  const [editAmount, setEditAmount] = useState<number>();
  const amount = editAmount ?? defaultAmount;
  const router = useRouter();

  const handleSelect = (e: any) => setEditAmount(e?.target?.value);
  const createOrder = async (
    _data: object,
    actions: CreateOrderBraintreeActions,
  ) => actions.order.create(generateOrderInfo(description, amount));

  const handleApprove = async (_data: any, actions: OnApproveBraintreeActions) => {
    await actions.order.capture();
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
            <PayPalButtons
              forceReRender={[amount]}
              createOrder={createOrder}
              fundingSource={donation ? "paypal" : undefined}
              onApprove={handleApprove}
              onError={handleError}
              style={{
                shape: "pill",
                color: "blue",
                layout: "vertical",
                label: donation ? "donate" : "buynow",
              }}
            />
          </PaypalProvider>
        </>
      )}
      {subscriptions.length > 0 && (
        subscriptions.map((s) => (
          <Subscription key={s.id} {...s} />
        ))
      )}
      {supporters && <SupporterCard supporters={supporters}/>}
    </Box>
  );
}



function generateOrderInfo(description: string, amount: number): import("@paypal/paypal-js/types/apis/orders").CreateOrderRequestBody {
  return {
    purchase_units: [
      {
        description,
        amount: {
          currency_code: "USD",
          value: amount + "",
        },
      },
    ],
  };
}

