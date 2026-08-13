import { useState } from "react";
import {
  type CreateOrderBraintreeActions,
  type OnApproveBraintreeActions,
  PayPalButtons,
} from "@paypal/react-paypal-js";
import Box from "@mui/material/Box";
import { useRouter } from "next/navigation";

import { FlexiblePaymentForm, PaymentOptions, SupporterCard, Subscription} from "./components";
import { PaypalProvider } from './utils'
import type { PaypalProductProps } from "./types";

export function PaypalProduct({
  options = [],
  description,
  defaultAmount,
  children,
  flexiblePayment,
  subscriptions = [],
  donation = false,
  supporters,
  slug,
}: PaypalProductProps) {
  const [editAmount, setEditAmount] = useState<number>();
  const amount = editAmount ?? defaultAmount;
  const router = useRouter();

  const handleSelect = (_event: React.ChangeEvent<HTMLInputElement>, value: string) => setEditAmount(Number(value));
  const selectedOption = options.find((option) => option.value === amount);
  const createOrder = async (
    _data: object,
    actions: CreateOrderBraintreeActions,
  ) => actions.order.create(generateOrderInfo(description, amount, selectedOption, slug));

  const handleApprove = async (_data: object, actions: OnApproveBraintreeActions) => {
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



function generateOrderInfo(
  description: string,
  amount: number,
  option?: { name: string; value: number },
  slug?: string,
): import("@paypal/paypal-js/types/apis/orders").CreateOrderRequestBody {
  const value = `${amount}`;
  const keySuffix = slug ? ` [${slug}]` : '';
  const purchaseUnit: import("@paypal/paypal-js/types/apis/orders").PurchaseUnit = {
    description: `${description}${keySuffix}`,
    amount: {
      currency_code: "USD",
      value,
    },
  };
  if (option) {
    purchaseUnit.items = [
      {
        name: `${option.name}${keySuffix}`,
        quantity: "1",
        unit_amount: {
          currency_code: "USD",
          value,
        },
        category: "DIGITAL_GOODS",
      },
    ];
    purchaseUnit.amount.breakdown = {
      item_total: {
        currency_code: "USD",
        value,
      },
    };
  }
  return {
    purchase_units: [purchaseUnit],
  };
}

