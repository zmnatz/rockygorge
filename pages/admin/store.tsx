import React from 'react';
import { AdminPage } from '../../src/components/AdminPage';

interface StoreItem {
  name: string;
  title?: string;
  description?: string;
  info?: string;
  defaultAmount?: number;
  hide?: boolean;
  options?: { name: string; value: number | string }[];
  subscriptions?: { name: string; id: string; description?: string; value?: string; options?: { label: string; value: string }[] }[];
  supporters?: string[];
  donation?: boolean;
  details?: string;
}

export default function StoreAdmin() {
  return (
    <AdminPage<StoreItem>
      title="Store Admin"
      endpoint="admin-store"
      getItemId={(item) => item.name}
      columns={[
        { header: 'Name', render: (item) => item.name },
        { header: 'Title', render: (item) => item.title },
        { header: 'Hide', render: (item) => item.hide ? 'Yes' : 'No' },
      ]}
      fields={[
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'description', label: 'Description', type: 'text' },
        { name: 'info', label: 'Info', type: 'text' },
        { name: 'defaultAmount', label: 'Default Amount', type: 'number' },
        { name: 'details', label: 'Details', type: 'textarea' },
        { name: 'hide', label: 'Hide Item', type: 'boolean' },
        { name: 'options', label: 'Options', type: 'keyValueMap' },
        { name: 'supporters', label: 'Supporters', type: 'textList' },
      ]}
    />
  );
}


