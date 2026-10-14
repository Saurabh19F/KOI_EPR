'use client';

import { MastersCrudPage } from '@/components/masters/masters-crud-page';

export default function LocationsPage() {
  return (
    <MastersCrudPage
      title="Locations"
      singularName="Location"
      moduleName="locations"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        {
          key: 'isDefault',
          label: 'Default',
          render: (value: boolean) => (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              value ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {value ? 'Yes' : 'No'}
            </span>
          ),
        },
        {
          key: 'isActive',
          label: 'Status',
          render: (value: boolean) => (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {value ? 'Active' : 'Inactive'}
            </span>
          ),
        },
      ]}
      formFields={[
        { name: 'code', label: 'Location Code', type: 'text', required: true, placeholder: 'e.g., LOC001' },
        { name: 'name', label: 'Location Name', type: 'text', required: true, placeholder: 'e.g., Mumbai Factory' },
        { name: 'type', label: 'Type', type: 'text', placeholder: 'e.g., factory, warehouse, office' },
        { name: 'address', label: 'Address', type: 'text', placeholder: 'Full address' },
        { name: 'city', label: 'City', type: 'text', placeholder: 'e.g., Mumbai' },
        { name: 'state', label: 'State', type: 'text', placeholder: 'e.g., Maharashtra' },
        { name: 'postalCode', label: 'Postal Code', type: 'text', placeholder: 'e.g., 400001' },
        { name: 'contactPerson', label: 'Contact Person', type: 'text', placeholder: 'Name' },
        { name: 'phone', label: 'Phone', type: 'text', placeholder: 'e.g., +91 9876543210' },
        { name: 'email', label: 'Email', type: 'text', placeholder: 'email@example.com' },
      ]}
    />
  );
}
