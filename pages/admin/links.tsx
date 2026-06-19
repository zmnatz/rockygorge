import React from 'react';
import { AdminPage } from '../../src/components/AdminPage';
import { Link } from '../../src/types/data';

export default function LinksAdmin() {
  return (
    <AdminPage<Link>
      title="Links Admin"
      endpoint="admin-links"
      getItemId={(item) => item.id}
      columns={[
        { header: 'ID', render: (item) => item.id },
        { header: 'Title', render: (item) => item.title },
        { header: 'Hide', render: (item) => item.hide ? 'Yes' : 'No' },
      ]}
      fields={[
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'description', label: 'Description', type: 'text' },
        { name: 'href', label: 'Href', type: 'text' },
        { name: 'header', label: 'Is Header', type: 'boolean' },
        { name: 'hide', label: 'Hide Link', type: 'boolean' },
      ]}
    />
  );
}
