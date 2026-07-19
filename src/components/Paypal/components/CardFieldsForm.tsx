import { useState } from "react";
import {
  PayPalCardFieldsProvider,
  PayPalCardNumberField,
  PayPalCardExpiryField,
  PayPalCardCvvField,
  usePayPalCardFieldsOneTimePaymentSession,
} from "@paypal/react-paypal-js/sdk-v6";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

interface CardFieldsFormProps {
  createOrder: () => Promise<{ orderId: string }>;
  onApprove: (data: { orderId: string }) => Promise<void>;
  onError: () => void;
}

function SubmitButton({
  createOrder,
  onApprove,
  onError,
}: {
  createOrder: () => Promise<{ orderId: string }>;
  onApprove: (data: { orderId: string }) => Promise<void>;
  onError: () => void;
}) {
  const { submit } = usePayPalCardFieldsOneTimePaymentSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    setIsSubmitting(true);
    try {
      const { orderId } = await createOrder();
      await submit(orderId);
      await onApprove({ orderId });
    } catch (error) {
      console.error("Card submission error:", error);
      onError();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={handleClick}
      disabled={isSubmitting}
      fullWidth
      sx={{ mt: 2 }}
    >
      {isSubmitting ? <CircularProgress size={24} /> : "Pay with Card"}
    </Button>
  );
}

export function CardFieldsForm({
  createOrder,
  onApprove,
  onError,
}: CardFieldsFormProps) {
  return (
    <PayPalCardFieldsProvider>
      <Box sx={{ mt: 2 }}>
        <PayPalCardNumberField
          placeholder="Card number"
          containerStyles={{ height: "2.5rem", marginBottom: "0.5rem" }}
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <PayPalCardExpiryField
              placeholder="MM/YY"
              containerStyles={{ height: "2.5rem" }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <PayPalCardCvvField
              placeholder="CVV"
              containerStyles={{ height: "2.5rem" }}
            />
          </Box>
        </Box>
        <SubmitButton
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onError}
        />
      </Box>
    </PayPalCardFieldsProvider>
  );
}
