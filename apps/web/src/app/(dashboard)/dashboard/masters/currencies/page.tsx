'use client';

import { MastersCrudPage } from '@/components/masters/masters-crud-page';

export default function CurrenciesPage() {
  return (
    <MastersCrudPage
      title="Currencies"
      singularName="Currency"
      moduleName="currencies"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'symbol', label: 'Symbol' },
        { key: 'decimalPlaces', label: 'Decimals' },
        {
          key: 'isBase',
          label: 'Base',
          render: (value: boolean) => (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              value ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {value ? 'Base' : 'Secondary'}
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
        { name: 'code', label: 'Currency Code', type: 'text', required: true, placeholder: 'e.g., USD' },
        { name: 'name', label: 'Currency Name', type: 'text', required: true, placeholder: 'e.g., US Dollar' },
        { name: 'symbol', label: 'Symbol', type: 'text', placeholder: 'e.g., $' },
        { name: 'decimalPlaces', label: 'Decimal Places', type: 'number', placeholder: 'e.g., 2' },
      ]}
    />
  );
}
