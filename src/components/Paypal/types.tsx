import React from "react";

interface Option {
  name: string;
  value: number;
}

interface SubscriptionItem {
  name: string;
  id: string;
  description: string;
  options: Array<{ label: string; value: string; }>;
  value?: string;
}

export interface PaypalProductProps {
  options?: Option[];
  description: string;
  defaultAmount: number;
  children: React.ReactNode;
  flexiblePayment?: boolean;
  subscriptions?: SubscriptionItem[];
  donation?: boolean;
  supporters?: any[];
}
