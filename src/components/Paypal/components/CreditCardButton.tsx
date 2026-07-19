import {
  PayPalGuestPaymentButton,
  type OnApproveDataOneTimePayments,
} from "@paypal/react-paypal-js/sdk-v6";

interface CreditCardButtonProps {
  createOrder: () => Promise<{ orderId: string }>;
  onApprove: (data: { orderId: string }) => Promise<void>;
  onError: () => void;
}

export function CreditCardButton({
  createOrder,
  onApprove,
  onError,
}: CreditCardButtonProps) {
  return (
    <PayPalGuestPaymentButton
      createOrder={createOrder}
      onApprove={(data: OnApproveDataOneTimePayments) => onApprove({ orderId: data.orderId })}
      onError={onError}
    />
  );
}
