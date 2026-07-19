import { useEffect, useState } from "react";
import {
  useEligibleMethods,
  ApplePayOneTimePaymentButton,
  GooglePayOneTimePaymentButton,
} from "@paypal/react-paypal-js/sdk-v6";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

interface AppleGooglePayProps {
  createOrder: () => Promise<{ orderId: string }>;
  onApprove: (data: { orderId: string }) => Promise<void>;
  onError: () => void;
  amount: string;
}

export function AppleGooglePay({
  createOrder,
  onApprove,
  onError,
  amount,
}: AppleGooglePayProps) {
  const { eligiblePaymentMethods, isLoading } = useEligibleMethods();
  const [applePayConfig, setApplePayConfig] = useState(null);
  const [googlePayConfig, setGooglePayConfig] = useState(null);

  useEffect(() => {
    if (!eligiblePaymentMethods) return;

    if (eligiblePaymentMethods.isEligible("applepay")) {
      setApplePayConfig(eligiblePaymentMethods.getDetails("applepay").config);
    }

    if (eligiblePaymentMethods.isEligible("googlepay")) {
      setGooglePayConfig(eligiblePaymentMethods.getDetails("googlepay").config);
    }
  }, [eligiblePaymentMethods]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!applePayConfig && !googlePayConfig) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: "center", my: 1 }}
      >
        or pay with
      </Typography>
      {applePayConfig && (
        <Box sx={{ mb: 1 }}>
          <ApplePayOneTimePaymentButton
            applePayConfig={applePayConfig}
            applePaySessionVersion={4}
            paymentRequest={{
              countryCode: "US",
              currencyCode: "USD",
              total: { label: "Payment", amount, type: "final" },
            }}
            createOrder={createOrder}
            onApprove={(data) => onApprove({ orderId: data.approveApplePayPayment.id })}
            onError={onError}
            buttonstyle="black"
            type="buy"
          />
        </Box>
      )}
      {googlePayConfig && (
        <Box>
          <GooglePayOneTimePaymentButton
            googlePayConfig={googlePayConfig}
            transactionInfo={{
              countryCode: "US",
              currencyCode: "USD",
              totalPriceStatus: "FINAL",
              totalPrice: amount,
            }}
            createOrder={createOrder}
            onApprove={(data) => onApprove({ orderId: data.id })}
            onError={onError}
            buttonColor="black"
            buttonType="pay"
          />
        </Box>
      )}
    </Box>
  );
}
