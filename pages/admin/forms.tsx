import React from 'react';
import { AdminPage } from '../../src/components/AdminPage';
import { Form } from '../../src/types/data';

export default function FormsAdmin() {
  return (
    <AdminPage<Form>
      title="Forms Admin"
      endpoint="admin-forms"
      getItemId={(item) => item.id}
      columns={[
        { header: 'ID', render: (item) => item.id },
        { header: 'Title', render: (item) => item.title },
        { header: 'Hide', render: (item) => item.hide ? 'Yes' : 'No' },
      ]}
      fields={[
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'description', label: 'Description', type: 'text' },
        { name: 'formId', label: 'Form ID', type: 'text' },
        { name: 'href', label: 'Href', type: 'text' },
        { name: 'formLink', label: 'Form Link', type: 'text' },
        { name: 'width', label: 'Width', type: 'number' },
        { name: 'height', label: 'Height', type: 'number' },
        { name: 'hide', label: 'Hide Form', type: 'boolean' },
      ]}
    />
  );
}
