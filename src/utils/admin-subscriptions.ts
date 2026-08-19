import type { SubscriptionItem } from '@/types/data';

export type SubscriptionField = 'name' | 'id' | 'description' | 'value';
export type SubscriptionOptionField = 'label' | 'value';

export function createEmptySubscription(): SubscriptionItem {
  return { name: '', id: '', description: '', options: [] };
}

export function addSubscription(list: SubscriptionItem[]): SubscriptionItem[] {
  return [...list, createEmptySubscription()];
}

export function removeSubscription(list: SubscriptionItem[], index: number): SubscriptionItem[] {
  return list.filter((_, idx) => idx !== index);
}

export function updateSubscriptionField(
  list: SubscriptionItem[],
  index: number,
  field: SubscriptionField,
  value: string
): SubscriptionItem[] {
  return list.map((subscription, idx) =>
    idx === index ? { ...subscription, [field]: value } : subscription
  );
}

export function addOption(list: SubscriptionItem[], subscriptionIndex: number): SubscriptionItem[] {
  return list.map((subscription, idx) =>
    idx === subscriptionIndex
      ? { ...subscription, options: [...subscription.options, { label: '', value: '' }] }
      : subscription
  );
}

export function removeOption(
  list: SubscriptionItem[],
  subscriptionIndex: number,
  optionIndex: number
): SubscriptionItem[] {
  return list.map((subscription, idx) =>
    idx === subscriptionIndex
      ? { ...subscription, options: subscription.options.filter((_, oIdx) => oIdx !== optionIndex) }
      : subscription
  );
}

export function updateOption(
  list: SubscriptionItem[],
  subscriptionIndex: number,
  optionIndex: number,
  field: SubscriptionOptionField,
  value: string
): SubscriptionItem[] {
  return list.map((subscription, idx) =>
    idx === subscriptionIndex
      ? {
          ...subscription,
          options: subscription.options.map((option, oIdx) =>
            oIdx === optionIndex ? { ...option, [field]: value } : option
          ),
        }
      : subscription
  );
}
