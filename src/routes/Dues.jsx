import { useState, useCallback } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Radio, Layout, Typography } from "antd";
import PRICES from "../utils/prices";

function DuesOption({ option }) {
  return (
    <Radio value={option}>
      {option.description} - ${option.amount.value}
    </Radio>
  );
}

export default function Dues() {
  const [product, setProduct] = useState(PRICES.DUES);
  const [status, setStatus] = useState();

  const handleSelect = useCallback((e) => setProduct(e?.target?.value), []);

  const createOrder = useCallback(
    (data, actions) => {
      return actions.order.create({
        purchase_units: [product]
      });
    },
    [product]
  );

  const handleApprove = useCallback(async (data, actions) => {
    await actions.order.capture();
    setStatus("SUCCESS");
  }, []);

  const handleError = useCallback((err) => console.warn(err), []);

  return (
    <Layout.Content>
      <Typography.Title level={3}>Pay your dues. Play rugby.</Typography.Title>
      {status === "SUCCESS" ? (
        <Typography>Thank you for paying your dues.</Typography>
      ) : (
        <>
          <Radio.Group size="large" onChange={handleSelect} value={product}>
            <DuesOption option={PRICES.DUES} />
            <DuesOption option={PRICES.NEW_DUES} />
            <DuesOption option={PRICES.OLD_DUES} />
          </Radio.Group>
          <PayPalButtons
            forceReRender={[product]}
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
