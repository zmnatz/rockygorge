import { useState, useCallback } from "react";
import {
  PayPalCardFieldsProvider,
  PayPalCardNumberField,
  PayPalCardExpiryField,
  PayPalCardCvvField,
  usePayPalCardFieldsOneTimePaymentSession,
} from "@paypal/react-paypal-js/sdk-v6";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";

interface CardFieldsFormProps {
  createOrder: () => Promise<{ orderId: string }>;
  onApprove: (data: { orderId: string }) => Promise<void>;
  onError: () => void;
}

interface EventState {
  isValid: boolean;
  isEmpty: boolean;
  isPotentiallyValid: boolean;
}

interface EventPayload {
  data: {
    number: EventState;
    cvv: EventState;
    expiry: EventState;
  };
}

function SubmitButton({
  createOrder,
  onApprove,
  onError,
  isFormValid,
  cardholderName,
}: {
  createOrder: () => Promise<{ orderId: string }>;
  onApprove: (data: { orderId: string }) => Promise<void>;
  onError: () => void;
  isFormValid: boolean;
  cardholderName: string;
}) {
  const { submit } = usePayPalCardFieldsOneTimePaymentSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    setIsSubmitting(true);
    try {
      const { orderId } = await createOrder();
      await submit(orderId, { name: cardholderName });
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
      disabled={isSubmitting || !isFormValid || !cardholderName.trim()}
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
  const [isFormValid, setIsFormValid] = useState(false);
  const [cardholderName, setCardholderName] = useState("");

  const handleValidityChange = useCallback((event: EventPayload) => {
    const { number, cvv, expiry } = event.data;
    const allValid = number.isValid && cvv.isValid && expiry.isValid;
    setIsFormValid(allValid);
  }, []);

  return (
    <PayPalCardFieldsProvider validitychange={handleValidityChange}>
      <Box sx={{ mt: 2 }}>
        <TextField
          fullWidth
          placeholder="Name on card"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          size="small"
          sx={{ mb: 1 }}
        />
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
          isFormValid={isFormValid}
          cardholderName={cardholderName}
        />
      </Box>
    </PayPalCardFieldsProvider>
  );
}
