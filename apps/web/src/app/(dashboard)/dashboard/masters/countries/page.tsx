'use client';

import { MastersCrudPage } from '@/components/masters/masters-crud-page';

export default function CountriesPage() {
  return (
    <MastersCrudPage
      title="Countries"
      singularName="Country"
      moduleName="countries"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'phoneCode', label: 'Phone Code' },
        { key: 'currencyCode', label: 'Currency' },
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
        { name: 'code', label: 'Country Code', type: 'text', required: true, placeholder: 'e.g., IN' },
        { name: 'name', label: 'Country Name', type: 'text', required: true, placeholder: 'e.g., India' },
        { name: 'phoneCode', label: 'Phone Code', type: 'text', placeholder: 'e.g., +91' },
        { name: 'currencyCode', label: 'Currency Code', type: 'text', placeholder: 'e.g., INR' },
      ]}
    />
  );
}
