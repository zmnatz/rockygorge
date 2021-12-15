import { useState, useCallback } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Layout, Typography } from "antd";

const SAVANNAH_PRODUCT = {
  purchase_units: [
    {
      description: "Savannah Tournament",
      amount: {
        currency_code: "USD",
        value: 200
      }
    }
  ]
};

export default function Savannah() {
  const [status, setStatus] = useState();
  const createOrder = useCallback((data, actions) => {
    return actions.order.create(SAVANNAH_PRODUCT);
  }, []);

  const handleApprove = useCallback(async (data, actions) => {
    await actions.order.capture();
    setStatus("SUCCESS");
  }, []);

  const handleError = useCallback((err) => console.warn(err), []);

  return (
    <Layout.Content>
      <Typography.Title level={3}>2022 Savannah Trip: $200</Typography.Title>
      {status === "SUCCESS" ? (
        <Typography>Thank you for paying.</Typography>
      ) : (
        <>
          <p>
            Rocky Gorge is headed to Savannah to play rugby. $200 covers
            transporation, tournament fee and hotels. If making your own
            arrangements, contact Joel Henry and pay your part of the tournaent
            fee ($20).
          </p>
          <PayPalButtons
            createOrder={createOrder}
            onApprove={handleApprove}
            onError={handleError}
            style={{
              shape: "pill",
              color: "blue",
              layout: "vertical",
              label: "buynow"
            }}
          />
        </>
      )}
    </Layout.Content>
  );
}
